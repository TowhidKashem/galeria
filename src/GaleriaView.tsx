import {
  useState,
  useId,
  useRef,
  useEffect,
  useLayoutEffect,
  cloneElement,
  ComponentProps,
  useContext,
} from 'react'

import { GaleriaViewProps } from './Galeria.types'
import type Native from './GaleriaView.native'
import {
  LayoutGroup,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import { Modal, useWindowDimensions } from 'react-native'
import { GaleriaContext } from './context'

const useClientEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

function Popup() {
  const { open } = useContext(GaleriaContext)

  // necessary to reset the state
  // also, let's not render unnecessary hooks, etc
  if (open) return <OpenPopup />

  return null
}

function OpenPopup() {
  const { open, setOpen, urls, initialIndex, theme, src } =
    useContext(GaleriaContext)

  const id = useId()
  const isDragging = useMotionValue(false)
  const carousel = urls.length > 1 && urls
  const layoutId = (src: string) => src

  const images = carousel || [src].filter(Boolean)

  const scrollRef = useRef<HTMLDivElement>(null)

  useClientEffect(
    function setInitialScrollIndex() {
      const scroller = scrollRef.current
      if (open && scroller) {
        const scrollerParentWidth =
          scroller.parentElement?.clientWidth || window.innerWidth
        scroller.scrollLeft = initialIndex * scrollerParentWidth
      }
    },
    [open, initialIndex],
  )

  if (__DEV__) {
    if (new Set(images).size !== images.length) {
      console.error(
        `GaleriaView: duplicate images found in urls prop. This will cause unexpected behavior.`,
      )
    }
  }

  const dragPercentProgress = useMotionValue(0)

  const backdropOpacity = useTransform(dragPercentProgress, [0, 0.4], [1, 0], {
    clamp: true,
  })

  const { width } = useWindowDimensions()

  const [imageIndex = initialIndex, setIndex] = useState<number>()

  console.log('[popup]', { imageIndex, initialIndex })

  if (!open || width <= 0 || images.length < 1) {
    return null
  }

  return (
    <>
      {
        <Modal
          visible={open}
          transparent
          onRequestClose={() => setOpen({ open: false })}
        >
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{ type: 'timing', duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: -1,
              background: theme === 'dark' ? 'black' : 'white',
              opacity: backdropOpacity,
            }}
          ></motion.div>
          <motion.div
            style={{
              width: '100%',
              flexDirection: 'row',
              display: 'flex',
              alignItems: 'center',
              height: '100vh',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
            }}
            ref={scrollRef}
          >
            {images.map((image, i) => {
              const isActiveItem = i === imageIndex
              const framerId = isActiveItem ? layoutId(image) : undefined
              return (
                <ViewabilityTracker
                  onEnter={(entry) => {
                    if (open) setIndex(i)
                    console.log('[onEnter]', id, i, entry.intersectionRatio)
                  }}
                  key={image}
                  scrollRef={scrollRef}
                >
                  <motion.img
                    layoutId={framerId}
                    src={image}
                    style={{
                      width: '100%',
                      scrollSnapAlign: 'center',
                      ...(!isActiveItem && {
                        opacity: backdropOpacity,
                      }),
                    }}
                    drag={carousel ? 'y' : true}
                    onDragStart={(e, info) => {
                      isDragging.set(true)
                    }}
                    onDrag={(e, info) => {
                      const parentHeight =
                        scrollRef.current?.clientHeight || window.innerHeight
                      const percentDragged = Math.abs(
                        info.offset.y / parentHeight,
                      )
                      dragPercentProgress.set(percentDragged)
                      console.log('[onDrag]', Math.round(percentDragged * 100))
                    }}
                    dragSnapToOrigin
                    onDragEnd={(e, info) => {
                      const parentHeight =
                        scrollRef.current?.clientHeight || window.innerHeight
                      const percentDragged = Math.abs(
                        info.offset.y / parentHeight,
                      )
                      isDragging.set(false)
                      if (percentDragged > 3 || info.velocity.y > 500) {
                        animate(dragPercentProgress, 40, { duration: 0.5 })
                        setOpen({ open: false })
                      } else {
                        animate(dragPercentProgress, 0, { duration: 0.5 })
                      }
                    }}
                    onClick={() => {
                      // run on next tick to transition back
                      if (!isDragging.get())
                        setTimeout(() => setOpen({ open: false }))
                    }}
                  />
                </ViewabilityTracker>
              )
            })}
          </motion.div>
        </Modal>
      }
    </>
  )
}

function Image({ style, src, index }: GaleriaViewProps) {
  const { setOpen } = useContext(GaleriaContext)

  return (
    <motion.img
      layoutId={src}
      src={src}
      style={style as object}
      onClick={() => {
        setOpen({
          open: true,
          src,
          initialIndex: index ?? 0,
        })
      }}
    />
  )
}

const Galeria: typeof Native = Object.assign(
  function Galeria({
    children,
    urls,
    theme = 'light',
  }: ComponentProps<typeof Native>) {
    const [openState, setOpen] = useState({
      open: false,
    } as
      | {
          open: false
        }
      | {
          open: true
          src: string
          initialIndex: number
        })
    const id = useId()
    return (
      <GaleriaContext.Provider
        value={{
          setOpen,
          urls: urls || [],
          theme,
          ...(openState.open
            ? {
                open: true,
                src: openState.src,
                initialIndex: openState.initialIndex,
              }
            : {
                open: false,
                src: '',
                initialIndex: 0,
              }),
        }}
      >
        <LayoutGroup id={id}>{children}</LayoutGroup>
      </GaleriaContext.Provider>
    )
  },
  {
    Image,
    Popup,
  },
)

export default Galeria

const ViewabilityTracker = ({
  children,
  itemVisiblePercentThreshold = 100,
  onEnter,
  scrollRef,
}: {
  children: JSX.Element
  onEnter?: (entry: IntersectionObserverEntry) => void
  itemVisiblePercentThreshold?: number
  scrollRef: React.RefObject<HTMLDivElement>
}) => {
  const ref = useRef<any>(null)

  const enter = useRef(onEnter)
  useEffect(() => {
    enter.current = onEnter
  })

  useEffect(() => {
    let observer: IntersectionObserver
    observer = new IntersectionObserver(
      ([entry]) => {
        const isVisibleWithinRoot =
          entry.boundingClientRect.top >= (entry.rootBounds?.top || 0) &&
          entry.boundingClientRect.bottom <= (entry.rootBounds?.bottom || 0)

        if (entry.isIntersecting && isVisibleWithinRoot) {
          enter.current?.(entry)
        }
      },

      {
        threshold: itemVisiblePercentThreshold / 100,
        root: scrollRef.current,
      },
    )

    if (ref.current) observer.observe(ref.current)

    return () => {
      observer?.disconnect()
    }
  }, [itemVisiblePercentThreshold])

  return cloneElement(children, { ref })
}
