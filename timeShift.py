import librosa
import numpy as np
import soundfile as sf
from argparse import ArgumentParser
from pydub import AudioSegment as A_S

parser = ArgumentParser()
parser.add_argument("file_path", help="path to WAV audio file", type=str)
parser.add_argument("--shift", help="pitch shifts the file by the given scale factor while keeping duration the same", action="store_true")
parser.add_argument("stretch", help="scale factor", type=float)
parser.add_argument("--splice", nargs=2, help="splices the audio before processing (times given in seconds)", metavar=("START", "STOP"), default=False, type=int)
args = parser.parse_args()
print(args)

if args.splice:
	t1 = args.splice[0] * 1000
	t2 = args.splice[1] * 1000
	audio = A_S.from_wav(args.file_path)
	audio = audio[t1:t2]
	audio.export(args.file_path, format="wav")

waveform, sr = librosa.load(args.file_path, sr=None, mono=False)
channels, orig_len = waveform.shape

win_len = 4096
hop_len = win_len // 4
synth_hop_len = int(hop_len * args.stretch) 
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

new_len = int(orig_len * args.stretch) + win_len
ola = np.zeros((channels, new_len))
norm_buffer = np.zeros(new_len)
for i in range(frames):
	pos = i * synth_hop_len
	ola[:, pos : pos + win_len] += windowed[i]
	norm_buffer[pos : pos + win_len] += win_func ** 2

norm_buffer[norm_buffer < 1e-10] = 1.0
ola /= norm_buffer[None, :]
ola = ola[:, :int(orig_len * args.stretch)]

if args.shift:
	sf.write('test_output.wav', ola.T, int(sr * args.stretch), 'PCM_24')
else:
	sf.write('test_output.wav', ola.T, sr, 'PCM_24')