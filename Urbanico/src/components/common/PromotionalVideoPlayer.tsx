import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';

interface PromotionalVideoPlayerProps {
  onExploreCatalog?: () => void;
}

export const PROMO_VIDEO_URL =
  'https://res.cloudinary.com/dfr0zghtc/video/upload/v1787295899/Now_generate_video_irfssp.mp4';
const POSTER_IMAGE =
  'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg';
const DEFAULT_PROMO_DURATION = 15;

export const PromotionalVideoPlayer: React.FC<PromotionalVideoPlayerProps> = ({
  onExploreCatalog,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(DEFAULT_PROMO_DURATION);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync time & duration on Web DOM video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const targetDuration = video.duration && !isNaN(video.duration) && video.duration > 0 ? video.duration : duration;
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
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Initial check in case it was already cached/loaded
    if (video.readyState >= 2) {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      setIsLoading(false);
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [duration]);

  const handleTogglePlay = () => {
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
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted && videoRef.current.paused) {
        videoRef.current.play().catch(() => {
          // If unmuted playback is rejected by browser policy without user gesture
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

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const effectiveDuration = duration || DEFAULT_PROMO_DURATION;
  const progressPercent = Math.min(100, (currentTime / effectiveDuration) * 100);
  const secondsLeft = Math.max(0, Math.ceil(effectiveDuration - currentTime));

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.spotlightBadge}>
            <Sparkles size={11} color="#D97706" />
            <Text style={styles.spotlightBadgeText}>PROMOTIONAL SPOTLIGHT</Text>
          </View>
          <Text style={styles.headingTitle}>Direct Yard in Motion</Text>
          <Text style={styles.headingSubtitle}>
            Watch our direct yard dispatch tour: automated batching, steel testing & instant site delivery.
          </Text>
        </View>
      </View>

      {/* Video Player Card */}
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
                      // Autoplay policy fallback
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
                borderRadius: 16,
              }}
            />
          ) : (
            <View style={styles.fallbackVideo} />
          )}

          {/* Gradient Overlay for high-contrast text and control readability */}
          <View style={styles.gradientOverlay} />

          {/* Top Info Bar inside Video */}
          <View style={styles.videoTopOverlay}>
            <View style={styles.liveIndicatorPill}>
              <View style={styles.liveRedDot} />
              <Text style={styles.liveIndicatorText}>DIRECT YARD HD</Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>
                00:{Math.floor(currentTime).toString().padStart(2, '0')} / 00:{Math.floor(effectiveDuration).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* Center Play/Pause button on touch */}
          <TouchableOpacity
            style={styles.centerPlayTouch}
            onPress={handleTogglePlay}
            activeOpacity={0.8}
          >
            {!isPlaying && (
              <View style={styles.centerPlayCircle}>
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Bottom Controls Bar inside Video */}
          <View style={styles.videoBottomOverlay}>
            {/* Progress scrub line */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.controlsLeft}>
                <TouchableOpacity
                  onPress={handleTogglePlay}
                  style={styles.controlIconBtn}
                  activeOpacity={0.7}
                  accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause size={17} color="#FFFFFF" />
                  ) : (
                    <Play size={17} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleToggleMute}
                  style={styles.controlIconBtn}
                  activeOpacity={0.7}
                  accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? (
                    <VolumeX size={17} color="#FFFFFF" />
                  ) : (
                    <Volume2 size={17} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRestart}
                  style={styles.controlIconBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Restart promotional video"
                >
                  <RotateCcw size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.controlsRight}>
                <Text style={styles.secondsRemainingText}>
                  {secondsLeft}s remaining
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Video Card Footer / Key Assurance Highlights */}
        <View style={styles.cardFooter}>
          <View style={styles.footerFeaturesRow}>
            <View style={styles.footerFeatureItem}>
              <Zap size={14} color="#111111" strokeWidth={2.2} />
              <Text style={styles.footerFeatureText}>3-Hour Dispatch</Text>
            </View>
            <View style={styles.footerFeatureDivider} />
            <View style={styles.footerFeatureItem}>
              <ShieldCheck size={14} color="#059669" strokeWidth={2.2} />
              <Text style={styles.footerFeatureText}>100% Lab Tested</Text>
            </View>
          </View>

          {onExploreCatalog && (
            <TouchableOpacity
              onPress={onExploreCatalog}
              style={styles.exploreCatalogBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreCatalogBtnText}>Explore Wholesale Materials</Text>
              <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  headerRow: {
    gap: 4,
  },
  headerLeft: {
    gap: 4,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  spotlightBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  headingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -0.4,
  },
  headingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#707072',
    lineHeight: 17,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  videoWrapper: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  fallbackVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111111',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  },
  videoTopOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  centerPlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 45,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  centerPlayCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(17, 17, 17, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    paddingLeft: 3,
  },
  videoBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    gap: 8,
    zIndex: 3,
  },
  progressBarTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlIconBtn: {
    padding: 3,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondsRemainingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  cardFooter: {
    padding: 14,
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  footerFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  footerFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerFeatureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
  },
  footerFeatureDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
  },
  exploreCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111111',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  exploreCatalogBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});
