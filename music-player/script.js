document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const coverImg = document.getElementById('cover-img');
  const title = document.getElementById('title');
  const artist = document.getElementById('artist');
  const audio = document.getElementById('audio');
  const playBtn = document.getElementById('play');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const progress = document.getElementById('progress');

  // Song data
  const songs = [
    {
      title: 'Sunset Boulevard',
      artist: 'The Midnight',
      cover: 'https://i.ibb.co/0yHqZkJ/sunset.jpg',
      audio: 'https://cdn.audiora.dev/audio/sunset.mp3',
      duration: 187
    },
    {
      title: 'Midnight Drive',
      artist: 'Kavinsky',
      cover: 'https://i.ibb.co/7VH1z6R/midnight.jpg',
      audio: 'https://cdn.audiora.dev/audio/midnight.mp3',
      duration: 203
    },
    {
      title: 'Neon Lights',
      artist: 'The Neons',
      cover: 'https://i.ibb.co/8DzJqyA/neon.jpg',
      audio: 'https://cdn.audiora.dev/audio/neon.mp3',
      duration: 159
    }
  ];

  // Current song index
  let isPlaying = false;
  let currentSongIndex = 0;

  // Load a song
  function loadSong(index) {
    const song = songs[index];
    coverImg.src = song.cover;
    title.textContent = song.title;
    artist.textContent = song.artist;
    audio.src = song.audio;
    audio.load();
    progress.value = 0;
  }

  // Play current song
  function playSong() {
    audio.play();
    playBtn.textContent = '⏸️';
    isPlaying = true;
  }

  // Pause current song
  function pauseSong() {
    audio.pause();
    playBtn.textContent = '▶️';
    isPlaying = false;
  }

  // Update progress bar
  function updateProgress() {
    const percent = Math.floor((audio.currentTime / songs[currentSongIndex].duration) * 100);
    progress.value = percent;
  }

  // Seek progress bar
  function seek(e) {
    const seekBar = e.target;
    const percent = seekBar.value;
    audio.currentTime = (percent / 100) * songs[currentSongIndex].duration;
  }

  // Event Listeners
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      pauseSong();
    } else {
      playSong();
    }
  });

  prevBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
    playSong();
  });

  nextBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
    playSong();
  });

  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
    playSong();
  });
  progress.addEventListener('input', seek);

  // Initialize with first song
  loadSong(currentSongIndex);
});