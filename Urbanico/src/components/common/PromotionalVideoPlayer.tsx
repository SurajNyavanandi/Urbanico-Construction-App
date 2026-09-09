import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

interface PromotionalVideoPlayerProps {
  onExploreCatalog?: () => void;
}

export const PROMO_VIDEO_URL =
  'https://res.cloudinary.com/dfr0zghtc/video/upload/v1787295899/Now_generate_video_irfssp.mp4';
const POSTER_IMAGE =
  'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg';
const DEFAULT_PROMO_DURATION = 15;

export const PromotionalVideoPlayer: React.FC<PromotionalVideoPlayerProps> = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(DEFAULT_PROMO_DURATION);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webViewRef = useRef<any>(null);

  // Sync time & duration on Web DOM video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    };

    const handlePlaying = () => {
      setIsPlaying(true);
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const targetDuration =
        video.duration && !isNaN(video.duration) && video.duration > 0
          ? video.duration
          : duration;
      if (time >= targetDuration) {
        video.currentTime = 0;
        setCurrentTime(0);
        video.play().catch(() => {});
      } else {
        setCurrentTime(time);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    if (video.readyState >= 2) {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [duration]);

  const handleTogglePlay = () => {
    if (Platform.OS === 'web') {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(!isPlaying);
      }
    } else {
      // Native WebView
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          nextPlaying
            ? `document.getElementById('promoVid')?.play(); true;`
            : `document.getElementById('promoVid')?.pause(); true;`
        );
      }
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (Platform.OS === 'web') {
      if (videoRef.current) {
        videoRef.current.muted = nextMuted;
        if (!nextMuted && videoRef.current.paused) {
          videoRef.current.play().catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
            }
          });
        }
      }
    } else {
      // Native WebView
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(
          `if (document.getElementById('promoVid')) { document.getElementById('promoVid').muted = ${nextMuted}; } true;`
        );
      }
    }
  };

  const handleNativeMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'timeupdate') {
        if (data.duration && !isNaN(data.duration) && data.duration > 0) {
          setDuration(data.duration);
        }
        if (typeof data.currentTime === 'number') {
          setCurrentTime(data.currentTime);
        }
      }
    } catch {
      // ignore
    }
  };

  const effectiveDuration = duration || DEFAULT_PROMO_DURATION;
  const progressPercent = Math.min(100, (currentTime / effectiveDuration) * 100);

  const promoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #000000;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      </style>
    </head>
    <body>
      <video
        id="promoVid"
        src="${PROMO_VIDEO_URL}"
        poster="${POSTER_IMAGE}"
        autoplay
        loop
        muted
        playsinline
        webkit-playsinline
      ></video>
      <script>
        var v = document.getElementById('promoVid');
        function initVid() {
          if (!v) return;
          v.play().catch(function() {
            v.muted = true;
            v.play().catch(function(){});
          });
        }
        document.addEventListener('DOMContentLoaded', initVid);
        window.onload = initVid;
        initVid();

        v.addEventListener('timeupdate', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'timeupdate',
              currentTime: v.currentTime,
              duration: v.duration
            }));
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* Minimalist Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headingTitle}>Yard Operations</Text>
        <Text style={styles.liveTag}>LIVE DISPATCH</Text>
      </View>

      {/* Sleek Minimalist Player Card */}
      <View style={styles.playerCard}>
        <View style={styles.videoWrapper}>
          {/* HTML5 Video element on web */}
          {Platform.OS === 'web' ? (
            <video
              ref={(ref) => {
                if (ref) {
                  videoRef.current = ref;
                  if (!hasStarted) {
                    ref.play().catch(() => {
                      setIsPlaying(false);
                    });
                    setHasStarted(true);
                  }
                }
              }}
              src={PROMO_VIDEO_URL}
              poster={POSTER_IMAGE}
              preload="auto"
              autoPlay
              muted={isMuted}
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 14,
              }}
            />
          ) : (
            <View style={[styles.nativeWebViewContainer, { pointerEvents: 'none' as any }]}>
              <WebView
                ref={webViewRef}
                source={{ html: promoHtml }}
                style={styles.nativeWebView}
                onMessage={handleNativeMessage}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scrollEnabled={false}
                bounces={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                androidLayerType="hardware"
                originWhitelist={['*']}
                mixedContentMode="always"
              />
            </View>
          )}

          {/* Minimal Tap Area for Play/Pause */}
          <TouchableOpacity
            style={styles.centerPlayTouch}
            onPress={handleTogglePlay}
            activeOpacity={0.9}
            accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
          >
            {!isPlaying && (
              <View style={styles.centerPlayCircle}>
                <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Minimal Controls Bar */}
          <View style={styles.bottomControlsBar}>
            {/* Slim Accent Progress Line */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>

            {/* Subtle Controls */}
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={handleTogglePlay}
                style={styles.controlPill}
                activeOpacity={0.7}
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={13} color="#FFFFFF" />
                ) : (
                  <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                )}
                <Text style={styles.controlPillText}>
                  {isPlaying ? 'Pause' : 'Play'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleMute}
                style={styles.controlIconBtn}
                activeOpacity={0.7}
                accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX size={15} color="#FFFFFF" />
                ) : (
                  <Volume2 size={15} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  liveTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  playerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  videoWrapper: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#000000',
  },
  nativeWebViewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  nativeWebView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  centerPlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  centerPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingLeft: 2,
  },
  bottomControlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    gap: 6,
    zIndex: 3,
  },
  progressBarTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  controlPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  controlIconBtn: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
  },
});
