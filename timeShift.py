import librosa
import numpy as np
import soundfile as sf
import sys

file_path = sys.argv[1]
process_type = sys.argv[2]
stretch = float(sys.argv[3])

waveform, sr = librosa.load(file_path, sr=None, mono=False)
channels, orig_len = waveform.shape

win_len = 4096
hop_len = win_len // 4
synth_hop_len = int(hop_len * stretch) 
win_func = np.hanning(win_len)

frames = int(np.ceil(orig_len / hop_len))
stft = np.zeros((frames, channels, win_len), dtype='complex')

for idx, pos in enumerate(range(0, orig_len, hop_len)):
	seg = waveform[:, pos : pos + win_len]
	if seg.shape[1] != win_len:
		break

	res = np.fft.fft(seg * win_func)
	stft[idx] = res

magnitudes = np.abs(stft)
phases = np.angle(stft)

bin_freq = np.pi * 2 * np.arange(win_len) / win_len
adv = bin_freq * hop_len

phase_diffs = phases - np.concatenate((np.zeros((1, channels, win_len)), phases[:-1]))

phase_dev = phase_diffs - adv[None, None, :]
wrapped_dev = np.mod(phase_dev + np.pi, np.pi * 2) - np.pi

freq_true = bin_freq[None, None, :] + (wrapped_dev / hop_len)

synth_phases = np.zeros((frames, channels, win_len))
synth_phases[0] = phase_diffs[0]

for i in range(1, frames):
	synth_phases[i] = synth_phases[i - 1] + synth_hop_len * freq_true[i - 1]

synth_freqs = magnitudes * np.exp(1j * synth_phases)

windowed = np.fft.ifft(synth_freqs).real * win_func

new_len = int(orig_len * stretch) + win_len
ola = np.zeros((channels, new_len))
norm_buffer = np.zeros(new_len)
for i in range(frames):
	pos = i * synth_hop_len
	ola[:, pos : pos + win_len] += windowed[i]
	norm_buffer[pos : pos + win_len] += win_func ** 2

norm_buffer[norm_buffer < 1e-10] = 1.0
ola /= norm_buffer[None, :]
ola = ola[:, :int(orig_len * stretch)]

if process_type == "stretch":
	sf.write('test_output.wav', ola.T, sr, 'PCM_24')
if process_type == "shift":
	sf.write('test_output.wav', ola.T, int(sr * stretch), 'PCM_24')