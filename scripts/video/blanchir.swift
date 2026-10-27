// Usage : swift scripts/video/blanchir.swift source.mp4 sortie.mp4
// Passe le fond gris clair de la vidéo (≈ #f3f3f3) au blanc pur, avec le même réglage que l'ancien
// filtre CSS brightness(1.06) contrast(1.08) — que Safari/iOS n'applique pas sur une <video>.
// v' = (v × 1.06 − 0.5) × 1.08 + 0.5, sur les valeurs sRGB (sans gestion des couleurs, comme en CSS).
import AVFoundation
import CoreImage

let a = CommandLine.arguments
let src = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let dst = URL(fileURLWithPath: a[2])
let k = 1.06 * 1.08, b = 0.5 - 0.5 * 1.08
let ctx = CIContext(options: [.workingColorSpace: NSNull(), .outputColorSpace: NSNull()])
let sem = DispatchSemaphore(value: 0)
AVVideoComposition.videoComposition(with: src, applyingCIFiltersWithHandler: { req in
  let m = CIFilter(name: "CIColorMatrix")!
  m.setValue(req.sourceImage, forKey: kCIInputImageKey)
  m.setValue(CIVector(x: k, y: 0, z: 0, w: 0), forKey: "inputRVector")
  m.setValue(CIVector(x: 0, y: k, z: 0, w: 0), forKey: "inputGVector")
  m.setValue(CIVector(x: 0, y: 0, z: k, w: 0), forKey: "inputBVector")
  m.setValue(CIVector(x: b, y: b, z: b, w: 0), forKey: "inputBiasVector")
  let out = m.outputImage!.applyingFilter("CIColorClamp").cropped(to: req.sourceImage.extent)
  req.finish(with: out, context: ctx)
}) { comp, err in
  try? FileManager.default.removeItem(at: dst)
  let ex = AVAssetExportSession(asset: src, presetName: AVAssetExportPresetHighestQuality)!
  ex.videoComposition = comp
  ex.outputURL = dst
  ex.outputFileType = .mp4
  ex.shouldOptimizeForNetworkUse = true
  ex.exportAsynchronously {
    if ex.status != .completed { print("ÉCHEC", a[1], ex.error ?? "") }
    sem.signal()
  }
}
sem.wait()
