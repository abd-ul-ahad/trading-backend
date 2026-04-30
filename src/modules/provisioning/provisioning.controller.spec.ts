import { Test, TestingModule } from '@nestjs/testing';
import { ProvisioningController } from './provisioning.controller';
import { ProvisioningService } from './provisioning.service';

describe('ProvisioningController', () => {
  let controller: ProvisioningController;
  let service: ProvisioningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvisioningController],
      providers: [
        {
          provide: ProvisioningService,
          useValue: {
            listAccounts: jest.fn(),
            getAccount: jest.fn(),
            createAccount: jest.fn(),
            updateAccount: jest.fn(),
            deleteAccount: jest.fn(),
            deployAccount: jest.fn(),
            undeployAccount: jest.fn(),
            redeployAccount: jest.fn(),
            createDemoAccount: jest.fn(),
            createLiveAccount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProvisioningController>(ProvisioningController);
    service = module.get<ProvisioningService>(ProvisioningService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have ProvisioningService injected', () => {
    expect(service).toBeDefined();
  });

  describe('deployAccount', () => {
    it('should call provisioningService.deployAccount with accountId', async () => {
      const accountId = 'test-account-123';
      jest.spyOn(service, 'deployAccount').mockResolvedValue(undefined);

      await controller.deployAccount(accountId);

      expect(service.deployAccount).toHaveBeenCalledWith(accountId);
      expect(service.deployAccount).toHaveBeenCalledTimes(1);
    });

    it('should return void on successful deployment', async () => {
      const accountId = 'test-account-123';
      jest.spyOn(service, 'deployAccount').mockResolvedValue(undefined);

      const result = await controller.deployAccount(accountId);

      expect(result).toBeUndefined();
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Deployment failed');
      jest.spyOn(service, 'deployAccount').mockRejectedValue(error);

      await expect(controller.deployAccount(accountId)).rejects.toThrow(
        'Deployment failed',
      );
    });
  });

  describe('undeployAccount', () => {
    it('should call provisioningService.undeployAccount with accountId', async () => {
      const accountId = 'test-account-123';
      jest.spyOn(service, 'undeployAccount').mockResolvedValue(undefined);

      await controller.undeployAccount(accountId);

      expect(service.undeployAccount).toHaveBeenCalledWith(accountId);
      expect(service.undeployAccount).toHaveBeenCalledTimes(1);
    });

    it('should return void on successful undeployment', async () => {
      const accountId = 'test-account-123';
      jest.spyOn(service, 'undeployAccount').mockResolvedValue(undefined);

      const result = await controller.undeployAccount(accountId);

      expect(result).toBeUndefined();
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Undeployment failed');
      jest.spyOn(service, 'undeployAccount').mockRejectedValue(error);

      await expect(controller.undeployAccount(accountId)).rejects.toThrow(
        'Undeployment failed',
      );
    });
  });

  describe('redeployAccount', () => {
    it('should call provisioningService.redeployAccount with accountId', async () => {
      const accountId = 'test-account-123';
      jest.spyOn(service, 'redeployAccount').mockResolvedValue(undefined);

      await controller.redeployAccount(accountId);

      expect(service.redeployAccount).toHaveBeenCalledWith(accountId);
      expect(service.redeployAccount).toHaveBeenCalledTimes(1);
    });

    it('should return void on successful redeployment', async () => {
      const accountId = 'test-account-123';
      jest.spyOn(service, 'redeployAccount').mockResolvedValue(undefined);

      const result = await controller.redeployAccount(accountId);

      expect(result).toBeUndefined();
    });

    it('should propagate errors from service', async () => {
      const accountId = 'test-account-123';
      const error = new Error('Redeployment failed');
      jest.spyOn(service, 'redeployAccount').mockRejectedValue(error);

      await expect(controller.redeployAccount(accountId)).rejects.toThrow(
        'Redeployment failed',
      );
    });
  });

  describe('createDemoAccount', () => {
    it('should call provisioningService.createDemoAccount with profileId and dto', async () => {
      const profileId = 'profile-123';
      const dto = {
        name: 'My Demo Account',
        balance: 10000,
        leverage: 100,
        serverName: 'ICMarketsSC-Demo',
      };
      const mockAccount = {
        _id: 'demo-account-123',
        name: dto.name,
        type: 'cloud',
        login: '12345678',
        server: dto.serverName,
        provisioningProfileId: profileId,
        magic: 0,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        accessToken: 'token123',
      };

      jest
        .spyOn(service, 'createDemoAccount')
        .mockResolvedValue(mockAccount as any);

      const result = await controller.createDemoAccount(profileId, dto);

      expect(service.createDemoAccount).toHaveBeenCalledWith(profileId, dto);
      expect(service.createDemoAccount).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });

    it('should return created demo account', async () => {
      const profileId = 'profile-123';
      const dto = {
        name: 'My Demo Account',
        balance: 10000,
        leverage: 100,
        serverName: 'ICMarketsSC-Demo',
      };
      const mockAccount = {
        _id: 'demo-account-123',
        name: dto.name,
      };

      jest
        .spyOn(service, 'createDemoAccount')
        .mockResolvedValue(mockAccount as any);

      const result = await controller.createDemoAccount(profileId, dto);

      expect(result).toBe(mockAccount);
    });

    it('should propagate errors from service', async () => {
      const profileId = 'profile-123';
      const dto = {
        name: 'My Demo Account',
        balance: 10000,
        leverage: 100,
        serverName: 'ICMarketsSC-Demo',
      };
      const error = new Error('Demo account creation failed');
      jest.spyOn(service, 'createDemoAccount').mockRejectedValue(error);

      await expect(
        controller.createDemoAccount(profileId, dto),
      ).rejects.toThrow('Demo account creation failed');
    });
  });

  describe('createLiveAccount', () => {
    it('should call provisioningService.createLiveAccount with dto', async () => {
      const dto = {
        name: 'My Live Account',
        login: '12345678',
        password: 'SecurePassword123',
        server: 'ICMarketsSC-Live',
        provisioningProfileId: 'profile-123',
        platform: 'mt4',
      };
      const mockAccount = {
        _id: 'live-account-123',
        name: dto.name,
        type: 'cloud',
        login: dto.login,
        server: dto.server,
        provisioningProfileId: dto.provisioningProfileId,
        magic: 0,
        application: 'MetaApi',
        connectionStatus: 'DISCONNECTED',
        state: 'DEPLOYED',
        accessToken: 'token123',
      };

      jest
        .spyOn(service, 'createLiveAccount')
        .mockResolvedValue(mockAccount as any);

      const result = await controller.createLiveAccount(dto);

      expect(service.createLiveAccount).toHaveBeenCalledWith(dto);
      expect(service.createLiveAccount).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAccount);
    });

    it('should return created live account', async () => {
      const dto = {
        name: 'My Live Account',
        login: '12345678',
        password: 'SecurePassword123',
        server: 'ICMarketsSC-Live',
        provisioningProfileId: 'profile-123',
      };
      const mockAccount = {
        _id: 'live-account-123',
        name: dto.name,
      };

      jest
        .spyOn(service, 'createLiveAccount')
        .mockResolvedValue(mockAccount as any);

      const result = await controller.createLiveAccount(dto);

      expect(result).toBe(mockAccount);
    });

    it('should propagate errors from service', async () => {
      const dto = {
        name: 'My Live Account',
        login: '12345678',
        password: 'SecurePassword123',
        server: 'ICMarketsSC-Live',
        provisioningProfileId: 'profile-123',
      };
      const error = new Error('Live account creation failed');
      jest.spyOn(service, 'createLiveAccount').mockRejectedValue(error);

      await expect(controller.createLiveAccount(dto)).rejects.toThrow(
        'Live account creation failed',
      );
    });
  });
});
