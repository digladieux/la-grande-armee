// Usage : swift loop.swift source.mp4 sortie.mp4 debut fin fondu
// Boucle frames[debut..<fin] ; les `fondu` dernières images se fondent dans frames[debut-fondu..<debut]
import AVFoundation
import CoreGraphics

let a = CommandLine.arguments
let src = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let dst = URL(fileURLWithPath: a[2])
let s = Int(a[3])!, e = Int(a[4])!, k = Int(a[5])!
let fps: Int32 = 30

let gen = AVAssetImageGenerator(asset: src)
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
func frame(_ i: Int) -> CGImage { try! gen.copyCGImage(at: CMTime(value: CMTimeValue(i), timescale: fps), actualTime: nil) }

let first = frame(s)
let W = first.width, H = first.height
try? FileManager.default.removeItem(at: dst)
let writer = try! AVAssetWriter(outputURL: dst, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 3_000_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H,
])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

let rect = CGRect(x: 0, y: 0, width: W, height: H)
for (n, i) in (s..<e).enumerated() {
  var pb: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
  CVPixelBufferLockBaseAddress(pb!, [])
  let ctx = CGContext(data: CVPixelBufferGetBaseAddress(pb!), width: W, height: H, bitsPerComponent: 8,
                      bytesPerRow: CVPixelBufferGetBytesPerRow(pb!), space: CGColorSpaceCreateDeviceRGB(),
                      bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue)!
  ctx.draw(frame(i), in: rect)
  let j = i - (e - k) // position dans la fenêtre de fondu
  if j >= 0 {
    ctx.setAlpha(CGFloat(j + 1) / CGFloat(k + 1))
    ctx.draw(frame(s - k + j), in: rect)
  }
  CVPixelBufferUnlockBaseAddress(pb!, [])
  while !input.isReadyForMoreMediaData { usleep(2000) }
  adaptor.append(pb!, withPresentationTime: CMTime(value: CMTimeValue(n), timescale: fps))
}
input.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
print(writer.status == .completed ? "ok \(e - s) images" : "erreur \(String(describing: writer.error))")
