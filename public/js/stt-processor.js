
const quantumSize = 128

/**
 * SttProcessor encodes the input audio stream (Int32Array) to LINEAR16 (Int16Array).
 */
class Lin16Processor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.quantaPerFrame = 12
    this.quantaCount = 0
    this.frame = new Int16Array(quantumSize * this.quantaPerFrame)
  }

  process(inputs, outputs, parameters) {
    const offset = quantumSize * this.quantaCount
    inputs[0][0].forEach((sample, idx) => this.frame[offset + idx] = Math.floor(sample * 0x7fff))
    this.quantaCount = this.quantaCount + 1
    if (this.quantaCount === this.quantaPerFrame) {
      this.port.postMessage(this.frame)
      this.quantaCount = 0
    }
    return true
  }
}

registerProcessor('stt-processor', Lin16Processor)
