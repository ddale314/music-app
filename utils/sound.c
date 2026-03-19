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

const u32 SR = 44100;
const f32 PI = 3.1415926535f;

struct note {
	f32 steps_from_c0;
	f32 start_time;
	f32 duration;
};

int main(int argc, char *argv[]) {
	// requires exactly prog + path + 3 * num_notes arguments
	assert(argc >= 2 && (argc - 2) % 3 == 0);
	
	u32 note_num = (argc - 2) / 3;
	struct note notes[note_num];

	char* file_path = argv[1];

	int argv_idx = 2;
	for (u32 i = 0; i < note_num; i++) {
		notes[i].steps_from_c0 = (f32)atof(argv[argv_idx++]);
		notes[i].start_time = (f32)atof(argv[argv_idx++]);
		notes[i].duration = (f32)atof(argv[argv_idx++]);
	}

	printf("Writing to: %s\n", file_path);
	FILE* f = fopen(file_path, "wb");
	if (!f) {
		printf("Failed to open file for writing\n");
		return 1;
	}

	f32 len = 0.0f;
	for (u32 i = 0; i < note_num; i++) {
		f32 end_time = notes[i].start_time + notes[i].duration;
		if (end_time > len) {
			len = end_time;
		}
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

	for (u32 i = 0; i < num_samples; i++) {
		f32 t = (f32)i / SR;

		f32 y = 0.0f;
		for (u32 n = 0; n < note_num; n++) {
			if (t >= notes[n].start_time && t < notes[n].start_time + notes[n].duration) {
				f32 env = 0.25f - (t - notes[n].start_time) * 0.1f;
				if (env < 0) env = 0;
				y += env * sinf((t - notes[n].start_time) * note(notes[n].steps_from_c0) * 2.0f * PI);
			}
		}

		if (y > 1.0f) y = 1.0f;
		if (y < -1.0f) y = -1.0f;

		i16 sample = (i16)(y * INT16_MAX);
		write_16(f, sample);
	}

	fclose(f);
	printf("Successfully finished.\n");
	return 0;
}