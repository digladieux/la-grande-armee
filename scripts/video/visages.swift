// Détection des visages (macOS Vision) : swift scripts/video/visages.swift img1.png img2.png …
// Sortie JSON {chemin: [[cx, cy, largeur] en % de l'image, depuis le haut-gauche]}
import AppKit
import Foundation
import Vision

var out: [String: [[Double]]] = [:]
for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path),
    let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil)
  else { continue }
  let req = VNDetectFaceRectanglesRequest()
  try? VNImageRequestHandler(cgImage: cg).perform([req])
  out[path] = (req.results ?? []).map { f in
    let b = f.boundingBox
    return [Double(b.midX * 100), Double((1 - b.midY) * 100), Double(b.width * 100)]
  }
}
print(String(data: try! JSONSerialization.data(withJSONObject: out), encoding: .utf8)!)
