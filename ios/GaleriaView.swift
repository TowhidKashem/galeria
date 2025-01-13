import ExpoModulesCore
import ImageViewer_swift
import UIKit

public class GaleriaView: ExpoView {
  var urls: [String]? {
    didSet {
      setupImageView()
    }
  }

  var initialIndex: Int? {
    didSet {
      setupImageView()
    }
  }

  var theme: Theme = .dark {
    didSet {
      setupImageView()
    }
  }

  var closeIconName: String?
  var rightNavItemIconName: String?

  let onPressRightNavItemIcon: EventDispatcher

  public required init(appContext: AppContext? = nil) {
    onPressRightNavItemIcon = EventDispatcher()
    super.init(appContext: appContext)
  }

  public override func didUpdateReactSubviews() {
    super.didUpdateReactSubviews()
    setupImageView()
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    setupImageView()
  }

  private func getChildImageView() -> UIImageView? {
    func findImageView(_ view: UIView) -> UIImageView? {
      if let imageView = view as? UIImageView {
        return imageView
      }
      for subview in view.subviews {
        if let found = findImageView(subview) {
          return found
        }
      }
      return nil
    }

    return findImageView(self)
  }

  private func setupImageView() {
    let viewerTheme = theme.toImageViewerTheme()
    guard let childImage = getChildImageView() else {
      return
    }

    if let urls = self.urls, let initialIndex = self.initialIndex {
      setupImageViewerWithUrls(
        childImage,
        urls: urls,
        initialIndex: initialIndex,
        viewerTheme: viewerTheme
      )
    } else {
      setupImageViewerWithSingleImage(childImage, viewerTheme: viewerTheme)
    }
  }

  private func setupImageViewerWithUrls(
    _ childImage: UIImageView,
    urls: [String],
    initialIndex: Int,
    viewerTheme: ImageViewerTheme
  ) {
    let urlObjects = urls.compactMap(URL.init(string:))
    let options = buildImageViewerOptions()

    childImage.setupImageViewer(
      urls: urlObjects,
      initialIndex: initialIndex,
      options: options
    )
  }

  private func setupImageViewerWithSingleImage(
    _ childImage: UIImageView,
    viewerTheme: ImageViewerTheme
  ) {
    guard let img = childImage.image else {
      return
    }
    let options = buildImageViewerOptions()

    childImage.setupImageViewer(images: [img], options: options)
  }

  private func buildImageViewerOptions() -> [ImageViewerOption] {
    let viewerTheme = theme.toImageViewerTheme()
    var options: [ImageViewerOption] = [.theme(viewerTheme)]
    let iconColor = theme.iconColor()

    if let closeIconName = closeIconName,
      let closeIconImage = UIImage(systemName: closeIconName)?
        .withTintColor(iconColor, renderingMode: .alwaysOriginal)
    {
      options.append(ImageViewerOption.closeIcon(closeIconImage))
    }

    if let rightIconName = rightNavItemIconName,
      let rightIconImage = UIImage(systemName: rightIconName)?
        .withTintColor(iconColor, renderingMode: .alwaysOriginal)
    {
      let rightNavItemOption = ImageViewerOption.rightNavItemIcon(
        rightIconImage,
        onTap: { [weak self] index in
          self?.onPressRightNavItemIcon(["index": index])
        }
      )
      options.append(rightNavItemOption)
    }

    return options
  }
}

public enum Theme: String, Enumerable {
  case dark
  case light

  func toImageViewerTheme() -> ImageViewerTheme {
    switch self {
    case .dark:
      return .dark
    case .light:
      return .light
    }
  }

  func iconColor() -> UIColor {
    switch self {
    case .dark:
      return .white
    case .light:
      return .black
    }
  }
}
