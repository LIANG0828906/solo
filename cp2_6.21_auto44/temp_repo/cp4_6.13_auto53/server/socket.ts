import { Server as SocketIOServer, Socket } from 'socket.io';
import { getDb } from './database';
import { v4 as uuidv4 } from 'uuid';

interface BoothRoom {
  sellerSocketId?: string;
  visitorCount: number;
}

const boothRooms = new Map<string, BoothRoom>();

export function initSocket(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join-booth', ({ boothId, isSeller, sellerName }: { boothId: string; isSeller: boolean; sellerName?: string }) => {
      socket.join(boothId);
      
      if (!boothRooms.has(boothId)) {
        boothRooms.set(boothId, { visitorCount: 0 });
      }
      
      const room = boothRooms.get(boothId)!;
      
      if (isSeller) {
        room.sellerSocketId = socket.id;
      } else {
        room.visitorCount++;
      }

      io.to(boothId).emit('online-count', { 
        visitorCount: room.visitorCount,
        sellerOnline: !!room.sellerSocketId 
      });

      const db = getDb();
      const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE booth_id = ? 
        ORDER BY created_at DESC 
        LIMIT 50
      `).all(boothId).reverse();
      
      socket.emit('message-history', messages);

      console.log(`Socket ${socket.id} joined booth ${boothId}, isSeller: ${isSeller}`);
    });

    socket.on('send-message', ({ boothId, senderName, isSeller, content }: {
      boothId: string;
      senderName: string;
      isSeller: boolean;
      content: string;
    }) => {
      if (!content || !content.trim()) return;

      const db = getDb();
      const messageId = uuidv4();
      const createdAt = Date.now();

      db.prepare(`
        INSERT INTO messages (id, booth_id, sender_name, is_seller, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(messageId, boothId, senderName, isSeller ? 1 : 0, content.trim(), createdAt);

      const message = {
        id: messageId,
        booth_id: boothId,
        sender_name: senderName,
        is_seller: isSeller ? 1 : 0,
        content: content.trim(),
        created_at: createdAt,
      };

      io.to(boothId).emit('new-message', message);

      if (!isSeller) {
        const room = boothRooms.get(boothId);
        if (room?.sellerSocketId) {
          io.to(room.sellerSocketId).emit('new-message-notification', {
            boothId,
            senderName,
            content: content.trim(),
          });
        }
      }

      console.log(`Message sent in booth ${boothId} by ${senderName}: ${content.substring(0, 30)}`);
    });

    socket.on('leave-booth', ({ boothId, isSeller }: { boothId: string; isSeller: boolean }) => {
      socket.leave(boothId);
      
      const room = boothRooms.get(boothId);
      if (room) {
        if (isSeller) {
          room.sellerSocketId = undefined;
        } else {
          room.visitorCount = Math.max(0, room.visitorCount - 1);
        }

        io.to(boothId).emit('online-count', {
          visitorCount: room.visitorCount,
          sellerOnline: !!room.sellerSocketId,
        });
      }

      console.log(`Socket ${socket.id} left booth ${boothId}`);
    });

    socket.on('disconnect', () => {
      for (const [boothId, room] of boothRooms.entries()) {
        if (room.sellerSocketId === socket.id) {
          room.sellerSocketId = undefined;
          io.to(boothId).emit('online-count', {
            visitorCount: room.visitorCount,
            sellerOnline: false,
          });
        }
      }
      console.log('Socket disconnected:', socket.id);
    });
  });
}

export function getBoothRoom(boothId: string): BoothRoom | undefined {
  return boothRooms.get(boothId);
}
