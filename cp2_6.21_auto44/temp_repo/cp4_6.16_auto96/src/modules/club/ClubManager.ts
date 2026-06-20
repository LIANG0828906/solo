import { useAppStore } from '@/store/useAppStore';
import {
  generateId, generateInviteCode, generateAnonymousName,
  generateChapterContent, generateChapterTitle
} from '@/utils/helpers';
import type { Club, Book, Chapter, Member } from '@/types';

export const ClubManager = {
  createClub(name: string): Club {
    const state = useAppStore.getState();
    let currentUserId = state.currentUserId;
    
    if (!currentUserId) {
      currentUserId = generateId();
      state.setCurrentUserId(currentUserId);
    }

    const hostMember: Member = {
      id: generateId(),
      name: generateAnonymousName(),
      clubId: '',
      joinedAt: Date.now(),
      isHost: true,
      avatarSeed: Math.floor(Math.random() * 1000),
    };

    const club: Club = {
      id: generateId(),
      name,
      inviteCode: generateInviteCode(),
      createdAt: Date.now(),
      currentBookId: null,
      currentChapter: 0,
      memberIds: [hostMember.id],
      hostId: hostMember.id,
    };

    hostMember.clubId = club.id;

    state.addClub(club);
    state.addMember(hostMember);

    const newMemberMap = { ...state.currentMemberMap, [club.id]: hostMember.id };
    state.setCurrentMemberMap(newMemberMap);

    state.addToast('俱乐部创建成功！', 'success');

    return club;
  },

  joinClub(inviteCode: string): Club | null {
    const state = useAppStore.getState();
    const club = state.clubs.find(c => c.inviteCode === inviteCode.toUpperCase());

    if (!club) {
      state.addToast('未找到该俱乐部，请检查邀请码', 'warning');
      return null;
    }

    let currentUserId = state.currentUserId;
    if (!currentUserId) {
      currentUserId = generateId();
      state.setCurrentUserId(currentUserId);
    }

    const existingMember = state.members.find(
      m => m.clubId === club.id && state.currentMemberMap[club.id] === m.id
    );

    if (existingMember) {
      state.addToast('你已是该俱乐部成员', 'info');
      return club;
    }

    const newMember: Member = {
      id: generateId(),
      name: generateAnonymousName(),
      clubId: club.id,
      joinedAt: Date.now(),
      isHost: false,
      avatarSeed: Math.floor(Math.random() * 1000),
    };

    const updatedClub: Club = {
      ...club,
      memberIds: [...club.memberIds, newMember.id],
    };

    state.addMember(newMember);
    state.updateClub(updatedClub);

    const newMemberMap = { ...state.currentMemberMap, [club.id]: newMember.id };
    state.setCurrentMemberMap(newMemberMap);

    state.addToast('加入俱乐部成功！', 'success');

    return updatedClub;
  },

  addBook(clubId: string, title: string, totalChapters: number, description: string): Book | null {
    const state = useAppStore.getState();
    const club = state.clubs.find(c => c.id === clubId);

    if (!club) return null;

    const member = state.getCurrentMember(clubId);
    if (!member || !member.isHost) {
      state.addToast('只有发起人可以添加书籍', 'warning');
      return null;
    }

    if (totalChapters < 2 || totalChapters > 20) {
      state.addToast('章节数需在2-20章之间', 'warning');
      return null;
    }

    const book: Book = {
      id: generateId(),
      title,
      totalChapters,
      description,
      coverSeed: Math.floor(Math.random() * 10000),
      clubId,
    };

    const chapters: Chapter[] = [];
    for (let i = 1; i <= totalChapters; i++) {
      chapters.push({
        id: generateId(),
        bookId: book.id,
        chapterNumber: i,
        title: generateChapterTitle(i),
        content: generateChapterContent(i, book.coverSeed + i),
      });
    }

    state.addBook(book);
    state.addChapters(chapters);

    const updatedClub: Club = {
      ...club,
      currentBookId: book.id,
      currentChapter: 1,
    };
    state.updateClub(updatedClub);

    state.addToast('书籍添加成功！', 'success');

    return book;
  },

  updateCurrentChapter(clubId: string, chapterNum: number): void {
    const state = useAppStore.getState();
    const club = state.clubs.find(c => c.id === clubId);

    if (!club || !club.currentBookId) return;

    const book = state.books.find(b => b.id === club.currentBookId);
    if (!book || chapterNum < 1 || chapterNum > book.totalChapters) return;

    const updatedClub: Club = {
      ...club,
      currentChapter: chapterNum,
    };
    state.updateClub(updatedClub);
  },

  getClubById(clubId: string): Club | undefined {
    return useAppStore.getState().clubs.find(c => c.id === clubId);
  },

  getBookById(bookId: string): Book | undefined {
    return useAppStore.getState().books.find(b => b.id === bookId);
  },

  getChaptersByBookId(bookId: string): Chapter[] {
    return useAppStore.getState().chapters
      .filter(c => c.bookId === bookId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  },

  getMembersByClubId(clubId: string): Member[] {
    const state = useAppStore.getState();
    return state.members.filter(m => m.clubId === clubId);
  },

  getClubsForCurrentUser(): Club[] {
    const state = useAppStore.getState();
    const memberClubIds = Object.keys(state.currentMemberMap);
    return state.clubs.filter(c => memberClubIds.includes(c.id));
  },
};
