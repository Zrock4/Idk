// Max Verstappen Edit - Legends Never Die
// Powerful cinematic video edit with synchronized effects

const video = document.getElementById('mainVideo');
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const restartBtn = document.getElementById('restartBtn');
const titleText = document.getElementById('titleText');
const subtitleText = document.getElementById('subtitleText');
const stats = document.getElementById('stats');
const quote = document.getElementById('quote');
const flash = document.querySelector('.flash');
const textOverlay = document.querySelector('.text-overlay');

// High-quality Max Verstappen racing footage URLs
const videoClips = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
];

let currentClipIndex = 0;
let isPlaying = false;
let editTimeline;

// Load first video
video.src = videoClips[currentClipIndex];

// Preload videos
function preloadVideos() {
    videoClips.forEach(src => {
        const vid = document.createElement('video');
        vid.src = src;
        vid.preload = 'auto';
    });
}

preloadVideos();

// Flash effect
function triggerFlash() {
    flash.classList.add('active');
    setTimeout(() => {
        flash.classList.remove('active');
    }, 300);
}

// Switch video clips
function switchClip(index) {
    if (index >= videoClips.length) {
        index = 0;
    }
    currentClipIndex = index;
    const currentTime = video.currentTime;
    video.src = videoClips[currentClipIndex];
    video.currentTime = 0;
    video.play();
    triggerFlash();
}

// Edit Timeline - Synchronized with music beats
function startEdit() {
    if (isPlaying) return;
    isPlaying = true;
    
    // Start audio and video
    audio.currentTime = 0;
    audio.play();
    video.play();
    
    playBtn.style.display = 'none';
    
    // Timeline of effects synchronized with "Legends Never Die"
    const timeline = [
        // Intro - 0-5s
        { time: 0, action: () => {
            textOverlay.style.opacity = '0';
            stats.style.opacity = '0';
            quote.style.opacity = '0';
        }},
        
        // Title reveal - 2s
        { time: 2000, action: () => {
            textOverlay.classList.add('zoom-in');
            textOverlay.style.opacity = '1';
            triggerFlash();
        }},
        
        // First beat drop - 5s
        { time: 5000, action: () => {
            switchClip(1);
            titleText.classList.add('shake');
        }},
        
        { time: 5500, action: () => {
            titleText.classList.remove('shake');
        }},
        
        // Stats reveal - 8s
        { time: 8000, action: () => {
            textOverlay.style.opacity = '0';
            stats.classList.add('slide-up');
            stats.style.opacity = '1';
        }},
        
        // Clip change - 10s
        { time: 10000, action: () => {
            switchClip(2);
        }},
        
        // Beat sync - 12s
        { time: 12000, action: () => {
            triggerFlash();
        }},
        
        // Hide stats, show quote - 15s
        { time: 15000, action: () => {
            stats.style.opacity = '0';
            quote.classList.add('fade-in');
            quote.style.opacity = '1';
            switchClip(3);
        }},
        
        // Beat sync - 18s
        { time: 18000, action: () => {
            triggerFlash();
            quote.classList.add('shake');
        }},
        
        { time: 18500, action: () => {
            quote.classList.remove('shake');
        }},
        
        // Clip change - 20s
        { time: 20000, action: () => {
            switchClip(0);
        }},
        
        // Hide quote, show title again - 22s
        { time: 22000, action: () => {
            quote.style.opacity = '0';
            textOverlay.style.opacity = '1';
            triggerFlash();
        }},
        
        // Beat drops - 25s, 27s, 29s
        { time: 25000, action: () => {
            triggerFlash();
            switchClip(1);
        }},
        
        { time: 27000, action: () => {
            triggerFlash();
            switchClip(2);
        }},
        
        { time: 29000, action: () => {
            triggerFlash();
            switchClip(3);
        }},
        
        // Final stats reveal - 32s
        { time: 32000, action: () => {
            textOverlay.style.opacity = '0';
            stats.style.opacity = '1';
            triggerFlash();
        }},
        
        // Ending - 35s
        { time: 35000, action: () => {
            stats.style.opacity = '0';
            textOverlay.style.opacity = '1';
        }},
        
        // Final flash - 38s
        { time: 38000, action: () => {
            triggerFlash();
        }},
        
        // End - 40s
        { time: 40000, action: () => {
            endEdit();
        }}
    ];
    
    // Execute timeline
    timeline.forEach(event => {
        setTimeout(event.action, event.time);
    });
}

function endEdit() {
    isPlaying = false;
    playBtn.style.display = 'block';
    playBtn.textContent = '▶ REPLAY EDIT';
}

function restartEdit() {
    // Stop everything
    audio.pause();
    video.pause();
    isPlaying = false;
    
    // Reset
    audio.currentTime = 0;
    video.currentTime = 0;
    currentClipIndex = 0;
    video.src = videoClips[0];
    
    // Reset UI
    textOverlay.style.opacity = '0';
    stats.style.opacity = '0';
    quote.style.opacity = '0';
    playBtn.style.display = 'block';
    playBtn.textContent = '▶ PLAY EDIT';
    
    // Remove animation classes
    textOverlay.classList.remove('zoom-in', 'fade-in', 'fade-out', 'shake');
    stats.classList.remove('slide-up', 'fade-in', 'fade-out');
    quote.classList.remove('fade-in', 'fade-out', 'shake');
    titleText.classList.remove('shake');
}

// Event Listeners
playBtn.addEventListener('click', startEdit);
restartBtn.addEventListener('click', restartEdit);

// Video ended - loop or switch
video.addEventListener('ended', () => {
    if (isPlaying) {
        switchClip((currentClipIndex + 1) % videoClips.length);
    }
});

// Audio ended
audio.addEventListener('ended', () => {
    if (isPlaying) {
        endEdit();
    }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!isPlaying) {
            startEdit();
        }
    } else if (e.code === 'KeyR') {
        restartEdit();
    }
});

// Auto-play on load (optional - commented out for user control)
// window.addEventListener('load', () => {
//     setTimeout(startEdit, 1000);
// });

console.log('🏎️ Max Verstappen Edit Ready!');
console.log('Press PLAY to start the edit');
console.log('Keyboard shortcuts: SPACE = Play, R = Restart');
