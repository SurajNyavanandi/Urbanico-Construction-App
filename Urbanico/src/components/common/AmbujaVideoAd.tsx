import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
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
  };

  const handleToggleMute = (e?: any) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (video) {
      const nextMuted = !isMuted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted && video.paused) {
        video.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
          }
        });
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

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
                borderRadius: 20,
              }}
            />
          ) : (
            <View style={styles.nativeFallback} />
          )}

          {/* High contrast overlay for readability & controls */}
          <View style={styles.subtleGradientOverlay} />

          {/* Top Bar: Brand Eyebrow Badge & Sound Control */}
          <View style={styles.topControlsRow}>
            <View style={styles.adBadge}>
              <Sparkles size={10} color="#D97706" />
              <Text style={styles.adBadgeText}>FEATURED BRAND SPOTLIGHT</Text>
            </View>

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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
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
  nativeFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E293B',
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
    justifyContent: 'space-between',
    zIndex: 3,
  },
  adBadge: {
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
  adBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#F1F5F9',
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
});
