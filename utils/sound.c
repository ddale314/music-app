#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <math.h>
#include <float.h>
#include <assert.h>
#include <stdlib.h>

typedef int16_t i16;
typedef uint16_t u16;
typedef uint32_t u32;
typedef float f32;

void write_16(FILE* f, u16 n) {
	fwrite(&n, sizeof(u16), 1, f);
}

void write_32(FILE* f, u32 n) {
	fwrite(&n, sizeof(u32), 1, f);
}

f32 note(f32 steps_from_c0) {
	return 16.35f * pow(2, steps_from_c0 / 12);
}

#define WRITE_STR(f, s) fwrite((s), 1, sizeof(s) - 1, f)
#define SR 44100
#define PI 3.1415926535f

struct note {
	f32 steps_from_c0;
	f32 duration;
};

#define BPM 100

//struct note notes[] = {
//	{ 59, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 59, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 59, 1.5f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 59, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 59, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 59, 1.5f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 59, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 62, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 55, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 57, 0.75f },
//	//{ INT16_MIN, 5.0f / BPM},
//	{ 59, 3 },
//};

int main(int argc, char *argv[]) {
	assert(argc >= 4 && argc % 2 == 0);
	struct note notes[argc - 2];

	char* file_path = argv[1];

	i16 idx = 0;
	for (int i = 2; i < argc; i++) {
		if (i % 2 == 0) {
			notes[idx].steps_from_c0 = (f32)atof(argv[i]);
		}
		else {
			notes[idx].duration = (f32)atof(argv[i]);
			idx++;
		}
		//printf("%s\n", argv[i]);
	}

	printf("Writing to: %s\n", file_path);
	FILE* f = fopen(file_path, "wb");

	u32 note_num = sizeof(notes) / sizeof(notes[0]);
	f32 len = 0.0f;
	for (u32 i = 0; i < note_num; i++) {
		len += notes[i].duration;
	}

	u32 num_samples = (u32)(SR * len);
	u32 file_size = num_samples * sizeof(u16) + 44;

	WRITE_STR(f, "RIFF");
	write_32(f, file_size - 8);
	WRITE_STR(f, "WAVE");

	WRITE_STR(f, "fmt ");
	write_32(f, 16);
	write_16(f, 1);
	write_16(f, 1);
	write_32(f, SR);
	write_32(f, SR * sizeof(u16));
	write_16(f, sizeof(u16));
	write_16(f, sizeof(u16)* 8);

	WRITE_STR(f, "data");
	write_32(f, num_samples * sizeof(u16));

	u32 note_idx = 0;
	f32 cur_note_start = 0;
	for (u32 i = 0; i < num_samples; i++) {
		f32 t = (f32)i / SR;

		f32 y = 0.0f;
		if (note_idx < note_num) {
			//printf("%f\n", (0.25f - (t - cur_note_start) * 0.1f));
			y = (0.25f - (t - cur_note_start) * 0.1f) * sinf(t * note(notes[note_idx].steps_from_c0) * 2.0f * PI);

			if (t > cur_note_start + notes[note_idx].duration) {
				note_idx++;
				cur_note_start = t;
			}
		}

		i16 sample = (i16)(y * INT16_MAX);
		write_16(f, sample);
	}

	fclose(f);
	printf("Successfully finished.");
	return 0;
}