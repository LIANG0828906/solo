import { motion } from 'framer-motion';
import type { Channel } from '../types';

interface ChannelListProps {
  channels: Channel[];
  currentChannel: Channel | null;
  onChannelClick: (channel: Channel) => void;
}

export function ChannelList({ channels, currentChannel, onChannelClick }: ChannelListProps) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {channels.map((channel) => {
        const isActive = currentChannel?.id === channel.id;
        return (
          <motion.button
            key={channel.id}
            className="px-2 py-1 text-xs font-mono rounded cursor-pointer border transition-all"
            style={{
              backgroundColor: isActive ? `${channel.themeColor}40` : 'transparent',
              borderColor: isActive ? channel.themeColor : '#333',
              color: isActive ? channel.themeColor : '#666',
            }}
            whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChannelClick(channel)}
          >
            {channel.genre}
          </motion.button>
        );
      })}
    </div>
  );
}
