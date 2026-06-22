import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { AdoptionApplication, Notification, ApiResponse } from '../../client/types';
import { mockAdoptions, mockNotifications, mockAnimals, mockUsers } from '../data/mockData';

type BroadcastFunction = (message: { type: string; payload: Notification | AdoptionApplication }) => void;

let adoptions: AdoptionApplication[] = [...mockAdoptions];
let notifications: Notification[] = [...mockNotifications];

const createRouter = (broadcast: BroadcastFunction) => {
  const router = Router();

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { animalId, applicantId, personalIntro, livingSituation, petExperience } = req.body;

      if (!animalId || !applicantId || !personalIntro || !livingSituation || !petExperience) {
        const response: ApiResponse<null> = {
          success: false,
          error: '缺少必填字段'
        };
        res.status(400).json(response);
        return;
      }

      const animal = mockAnimals.find(a => a.id === animalId);
      if (!animal) {
        const response: ApiResponse<null> = {
          success: false,
          error: '动物不存在'
        };
        res.status(404).json(response);
        return;
      }

      if (animal.status !== 'available') {
        const response: ApiResponse<null> = {
          success: false,
          error: '该动物不可领养'
        };
        res.status(400).json(response);
        return;
      }

      const user = mockUsers.find(u => u.id === applicantId);
      if (!user) {
        const response: ApiResponse<null> = {
          success: false,
          error: '用户不存在'
        };
        res.status(404).json(response);
        return;
      }

      const newApplication: AdoptionApplication = {
        id: uuidv4(),
        animalId,
        animalName: animal.name,
        applicantId,
        applicantName: user.username,
        personalIntro,
        livingSituation,
        petExperience,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      adoptions.push(newApplication);

      const adminNotification: Notification = {
        id: uuidv4(),
        userId: mockUsers[0].id,
        type: 'new_application',
        message: `收到新的领养申请：${user.username}申请领养${animal.name}`,
        read: false,
        createdAt: new Date().toISOString()
      };

      notifications.push(adminNotification);
      broadcast({ type: 'notification', payload: adminNotification });

      const response: ApiResponse<AdoptionApplication> = {
        success: true,
        data: newApplication,
        message: '申请提交成功'
      };
      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: '服务器错误'
      };
      res.status(500).json(response);
    }
  });

  router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicantId } = req.query;
      let filteredAdoptions = [...adoptions];

      if (applicantId && typeof applicantId === 'string') {
        filteredAdoptions = filteredAdoptions.filter(a => a.applicantId === applicantId);
      }

      const response: ApiResponse<AdoptionApplication[]> = {
        success: true,
        data: filteredAdoptions
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: '服务器错误'
      };
      res.status(500).json(response);
    }
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const application = adoptions.find(a => a.id === id);

      if (!application) {
        const response: ApiResponse<null> = {
          success: false,
          error: '申请不存在'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<AdoptionApplication> = {
        success: true,
        data: application
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: '服务器错误'
      };
      res.status(500).json(response);
    }
  });

  router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['approved', 'rejected'].includes(status)) {
        const response: ApiResponse<null> = {
          success: false,
          error: '无效的状态值'
        };
        res.status(400).json(response);
        return;
      }

      const applicationIndex = adoptions.findIndex(a => a.id === id);
      if (applicationIndex === -1) {
        const response: ApiResponse<null> = {
          success: false,
          error: '申请不存在'
        };
        res.status(404).json(response);
        return;
      }

      const oldStatus = adoptions[applicationIndex].status;
      if (oldStatus !== 'pending') {
        const response: ApiResponse<null> = {
          success: false,
          error: '该申请已审核，无法重复操作'
        };
        res.status(400).json(response);
        return;
      }

      adoptions[applicationIndex] = {
        ...adoptions[applicationIndex],
        status,
        reviewedAt: new Date().toISOString()
      };

      const updatedApplication = adoptions[applicationIndex];

      const animalIndex = mockAnimals.findIndex(a => a.id === updatedApplication.animalId);
      if (animalIndex !== -1) {
        if (status === 'approved') {
          mockAnimals[animalIndex] = {
            ...mockAnimals[animalIndex],
            status: 'adopted'
          };
        } else if (status === 'rejected') {
          mockAnimals[animalIndex] = {
            ...mockAnimals[animalIndex],
            status: 'available'
          };
        }
      }

      const statusMessage = status === 'approved' ? '已通过' : '已拒绝';
      const userNotification: Notification = {
        id: uuidv4(),
        userId: updatedApplication.applicantId,
        type: 'status_update',
        message: `您申请领养${updatedApplication.animalName}的申请${statusMessage}`,
        read: false,
        createdAt: new Date().toISOString()
      };

      notifications.push(userNotification);
      broadcast({ type: 'notification', payload: userNotification });
      broadcast({ type: 'status_update', payload: updatedApplication });

      const response: ApiResponse<AdoptionApplication> = {
        success: true,
        data: updatedApplication,
        message: '审核成功'
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: '服务器错误'
      };
      res.status(500).json(response);
    }
  });

  router.post('/:id/feedback', async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { feedback } = req.body;

      if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: '反馈内容不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const applicationIndex = adoptions.findIndex(a => a.id === id);
      if (applicationIndex === -1) {
        const response: ApiResponse<null> = {
          success: false,
          error: '申请不存在'
        };
        res.status(404).json(response);
        return;
      }

      if (adoptions[applicationIndex].status !== 'approved') {
        const response: ApiResponse<null> = {
          success: false,
          error: '只有已通过的申请才能提交反馈'
        };
        res.status(400).json(response);
        return;
      }

      adoptions[applicationIndex] = {
        ...adoptions[applicationIndex],
        feedback
      };

      const updatedApplication = adoptions[applicationIndex];

      const response: ApiResponse<AdoptionApplication> = {
        success: true,
        data: updatedApplication,
        message: '反馈提交成功'
      };
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: '服务器错误'
      };
      res.status(500).json(response);
    }
  });

  return router;
};

export default createRouter;
