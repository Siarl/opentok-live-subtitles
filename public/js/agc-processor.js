class AGCProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  constructor(options) {
    super(options);

    this.threshold = -10; // dBFS
    this.attackTime = 0.08; // seconds
    this.releaseTime = 0.5; // seconds
    this.smoothingTimeConstant = 0.4; // seconds
    this.targetLevel = -5; // dBFS

    this.inputGain = 1;
    this.outputGain = 1;
    this.release = 0;
  }

  process(inputs, outputs, parameters) {
    let input = inputs[0];
    let output = outputs[0];
    for (let channel = 0; channel < output.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      outputChannel.set(inputChannel.map(v => {
        // Apply input gain
        const sample = v * this.inputGain;

        // Calculate the RMS of the signal
        this.release = Math.max(this.release, Math.abs(sample));

        // Smooth the RMS value using an exponential moving average
        this.release = this.release + (sample - this.release) / (1 + this.smoothingTimeConstant * sampleRate);

        // Calculate the gain reduction needed to bring the signal to the target level
        let gainReduction = this.targetLevel - 20 * Math.log10(this.release);

        // Clamp the gain reduction to the minimum and maximum values allowed by the processor's gain parameter
        gainReduction = Math.max(gainReduction, 0);
        gainReduction = Math.min(gainReduction, 1);

        // Calculate the attack and release time constants based on the attack and release times
        const attack = Math.exp(-1 / (this.attackTime * sampleRate));
        const release = Math.exp(-1 / (this.releaseTime * sampleRate));

        // If the gain reduction is above the threshold, apply the attack time constant; otherwise, apply the release time constant
        if (gainReduction > this.threshold) {
          this.outputGain = this.outputGain + (gainReduction - this.outputGain) * attack;
        } else {
          this.outputGain = this.outputGain + (gainReduction - this.outputGain) * release;
        }

        // Apply the output gain to the sample and return it
        return sample * this.outputGain;
      }));
    }

    return true;
  }
}

registerProcessor('agc-processor', AGCProcessor)
