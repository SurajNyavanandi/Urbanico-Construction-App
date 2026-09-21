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
  Volume2,
  VolumeX,
  ArrowRight,
} from 'lucide-react-native';

interface AmbujaVideoAdProps {
  onPressAd?: () => void;
}

export const AMBUJA_AD_VIDEO_URL =
  'https://res.cloudinary.com/dfr0zghtc/video/upload/v1787727785/AmbujaCementAdd_j9ufya.mp4';

export const AmbujaVideoAd: React.FC<AmbujaVideoAdProps> = ({
  onPressAd,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const handleTogglePlay = (e?: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (Platform.OS === 'web') {
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
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
            ? `document.getElementById('ambujaVid')?.play(); true;`
            : `document.getElementById('ambujaVid')?.pause(); true;`
        );
      }
    }
  };

  const handleToggleMute = (e?: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (Platform.OS === 'web') {
      const video = videoRef.current;
      if (video) {
        video.muted = nextMuted;
        if (!nextMuted && video.paused) {
          video.play().catch(() => {
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
          `if (document.getElementById('ambujaVid')) { document.getElementById('ambujaVid').muted = ${nextMuted}; } true;`
        );
      }
    }
  };

  const ambujaHtml = `
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
        id="ambujaVid"
        src="${AMBUJA_AD_VIDEO_URL}"
        autoplay
        loop
        muted
        playsinline
        webkit-playsinline
      ></video>
      <script>
        var v = document.getElementById('ambujaVid');
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
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.94}
        onPress={onPressAd}
        style={styles.cardContainer}
      >
        {/* 16:9 Aspect Ratio Video Box */}
        <View style={styles.videoWrapper}>
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
              src={AMBUJA_AD_VIDEO_URL}
              preload="metadata"
              crossOrigin="anonymous"
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
                borderRadius: 20,
              }}
            />
          ) : (
            <View style={[styles.nativeWebViewContainer, { pointerEvents: 'none' as any }]}>
              <WebView
                ref={webViewRef}
                source={{ html: ambujaHtml }}
                style={styles.nativeWebView}
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

          {/* High contrast overlay for readability & controls */}
          <View style={[styles.subtleGradientOverlay, { pointerEvents: 'none' as any }]} />

          {/* Top Bar: Sound Control */}
          <View style={styles.topControlsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleMute}
              style={styles.soundButton}
            >
              {isMuted ? (
                <VolumeX size={14} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <Volume2 size={14} color="#FFFFFF" strokeWidth={2.5} />
              )}
              <Text style={styles.soundButtonText}>
                {isMuted ? 'UNMUTE' : 'MUTE'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Center Play Button if Paused */}
          {!isPlaying && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTogglePlay}
              style={styles.centerPlayButton}
            >
              <View style={styles.centerPlayCircle}>
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}

          {/* Bottom Bar: Action Pill */}
          <View style={styles.bottomRow}>
            <View style={styles.brandTitleGroup}>
              <Text style={styles.brandTitle}>Ambuja Cement</Text>
              <Text style={styles.brandSub}>Giant Compressive Strength • Direct Factory Supply</Text>
            </View>

            <View style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Shop Cement</Text>
              <ArrowRight size={13} color="#000000" strokeWidth={2.5} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 6px 14px rgba(0, 0, 0, 0.12)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 4,
      },
    }),
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    padding: 12,
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
  subtleGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 3,
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  soundButtonText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  centerPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  centerPlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  brandTitleGroup: {
    flex: 1,
    paddingRight: 10,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#F1F5F9',
    marginTop: 1,
    ...Platform.select({
      web: {
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
    }),
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  exploreButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
});
