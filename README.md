# music-app

Currently -> AudioCanvas component:
				returns canvas where visualization of audio data is displayed
				returns some number of recorded audio segments which are globally defined?!!
					audio segments appear the same for each AudioCanvas component, need to be instance attributes
			
			"Record" page has:
				AudioCanvas component
				Button that starts/stops recording for AudioCanvases
					recorder is also a global (class??) attribute?!

Ideally -> AudioCanvas component:
				visualization displayed on canvas
				where do we recieve audio data from?
					canvas should be able to:
						display audio playing in real time
						"playback" some stream of audio <- i.e. previously recorded
					does it make sense to define separate processes for these two types of data? not really
						how do we get the real time audio?
			Recording"Canvas" component:
				instance should define its own recorder/way to record audio
				audio segments should be attributes of the recorder instance that created them?? <- does this make sense	
				returns some display of audio segments that have been recorded by the instance's recorder attribute
				should this define all ways to manipulate the audio segments?
					what are the alternatives
				
			Under this hypothetical structure we also need a Recorder component
				handles recording of audio
				has audio segments it recorded as attribute
				visually defined as a button used to start (and pause?) and stop recording
 
