// Extrait toutes les images d'une vidéo en PNG (macOS, sans ffmpeg).
// Usage : swift scripts/video/images.swift video.mp4 dossier-sortie
import AVFoundation
import AppKit

let args = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let out = args[2]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
let track = asset.tracks(withMediaType: .video).first!
let fps = Int32(track.nominalFrameRate.rounded())
let count = Int(CMTimeGetSeconds(asset.duration) * Double(fps))
let gen = AVAssetImageGenerator(asset: asset)
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
for i in 0..<count {
  let cg = try! gen.copyCGImage(at: CMTime(value: CMTimeValue(i), timescale: fps), actualTime: nil)
  let png = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!
  try! png.write(to: URL(fileURLWithPath: "\(out)/\(String(format: "%04d", i)).png"))
}
print("\(count) images (\(fps) i/s) → \(out)")
