/* global sleep */

//
//	Variables
//

const audioDir = "assets/audio/";

let audioCurrentMusic;
let audioKillFades = false;

// eslint-disable-next-line  no-unused-vars
class AudioSystem {
	//
	//  Methods
	//

	static playSound = (sound) => sound.cloneNode().play();

	static playMusic = async (music) => {
		if (audioCurrentMusic) await AudioSystem.fadeOut(audioCurrentMusic);

		audioCurrentMusic = music.cloneNode();

		audioCurrentMusic.volume = 0;
		audioCurrentMusic.play();
		audioCurrentMusic.loop = true;

		AudioSystem.fadeIn(audioCurrentMusic);
	}

	static startMenuMusic = async (pauseMenu = false) => {
		if (audioCurrentMusic) await AudioSystem.killMusic();

		await AudioSystem.playMusic(pauseMenu ? AudioLibrary.music.menu.pause_menu : AudioLibrary.music.menu.main_menu);
	}

	static stopMusic = async () => {
		if (!audioCurrentMusic) return;

		audioKillFades = true;

		// Wait for any fade-ins to die
		sleep(550);

		audioKillFades = false;

		AudioSystem.fadeOut(audioCurrentMusic);
	}

	static killMusic = async () => {
		if (!audioCurrentMusic) {
			return;
		}

		while (audioCurrentMusic.volume > 0) {
			audioCurrentMusic.volume = Math.max(0, audioCurrentMusic.volume - 0.1);
			
			await sleep(100);
		}

		audioCurrentMusic.pause();
	}

	static fadeIn = async (music) => {
		while (!audioKillFades && music.volume < 1) {
			music.volume = Math.min(1, music.volume + 0.025);

			await sleep(500);
		}
	}

	static fadeOut = async (music) => {
		while (!audioKillFades && music.volume > 0) {
			music.volume = Math.max(0, music.volume - 0.025);
			
			await sleep(125);
		}

		music.pause();
	}
}

class AudioLibrary {
	//
	//  Variables
	//

	// UI Sounds
	static ui = {
		button: new Audio(`${audioDir}ui/button.mp3`),
		click: new Audio(`${audioDir}ui/click.mp3`),
		confirm: new Audio(`${audioDir}ui/confirm.mp3`)
	};

	// Sound effects
	static sfx = {
		// Diegetic
		"knocking": new Audio(`${audioDir}sfx/knocking.mp3`),
		"collapse": new Audio(`${audioDir}sfx/collapse.mp3`),
		"door": new Audio(`${audioDir}sfx/door.mp3`),
		"bed": new Audio(`${audioDir}sfx/bed.mp3`),
		"behind-door": new Audio(`${audioDir}sfx/behind_door.mp3`),
		"door-close": new Audio(`${audioDir}sfx/door_close.mp3`),
		"chair": new Audio(`${audioDir}sfx/chair.mp3`),
		"chair2": new Audio(`${audioDir}sfx/chair2.mp3`),
		"bowl": new Audio(`${audioDir}sfx/bowl.mp3`),

		// Non-diegetic
		"stinger": new Audio(`${audioDir}sfx/non-diegetic/stinger.mp3`)
	}

	// Music
	static music = {
		// Menu Music
		menu: {
			main_menu: new Audio(`${audioDir}music/menu/main_menu.mp3`),
			pause_menu: new Audio(`${audioDir}music/menu/pause_menu.mp3`),
		},
		
		// Game Music
		"limping": new Audio(`${audioDir}music/limping.mp3`),
		"flashback": new Audio(`${audioDir}music/flashback.mp3`),
		"sofa": new Audio(`${audioDir}music/sofa.mp3`),
		"calm": new Audio(`${audioDir}music/calm.mp3`),
	}
}