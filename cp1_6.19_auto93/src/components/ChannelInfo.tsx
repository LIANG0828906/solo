import { motion, AnimatePresence } from 'framer-motion';
import type { Channel } from '../types';

interface ChannelInfoProps {
  channel: Channel | null;
  signalStrength: number;
}

export function ChannelInfo({ channel, signalStrength }: ChannelInfoProps) {
  const isVisible = channel && signalStrength > 20;

  return (
    <div className="min-h-[80px] w-full">
      <AnimatePresence mode="wait">
        {isVisible && channel && (
          <motion.div
            key={channel.id}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-lg font-bold mb-1"
              style={{ color: channel.themeColor }}
              animate={{
                textShadow: signalStrength > 80
                  ? [`0 0 10px ${channel.themeColor}80`, `0 0 20px ${channel.themeColor}40`, `0 0 10px ${channel.themeColor}80`]
                  : 'none',
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {channel.name}
            </motion.div>

            <div className="text-xs text-gray-400 mb-1">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: `${channel.themeColor}30`,
                  color: channel.themeColor,
                  border: `1px solid ${channel.themeColor}50`,
                }}
              >
                {channel.genre}
              </span>
            </div>

            <motion.div
              className="text-xs text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {channel.frequency.toFixed(1)} MHz
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
