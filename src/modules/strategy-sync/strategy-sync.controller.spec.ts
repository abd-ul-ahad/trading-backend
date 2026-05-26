import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StrategySyncController } from './strategy-sync.controller';
import { StrategySyncService } from './strategy-sync.service';
import { SyncRunResult } from './dto/sync-result.dto';

describe('StrategySyncController', () => {
  let controller: StrategySyncController;
  let service: { syncAll: jest.Mock; runBackfill: jest.Mock };

  const fullResult: SyncRunResult = {
    runAt: new Date().toISOString(),
    accountId: '11111111-1111-1111-1111-111111111111',
    dealsFetched: 4,
    dealsAttributed: 2,
    dealsUntagged: 1,
    dealsUnknownStrategy: 1,
    strategiesProcessed: 2,
    perStrategy: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrategySyncController],
      providers: [
        {
          provide: StrategySyncService,
          useValue: {
            syncAll: jest.fn(),
            runBackfill: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(StrategySyncController);
    service = module.get(StrategySyncService);
  });

  describe('POST /strategy-sync/run', () => {
    it('returns the SyncRunResult from the service', async () => {
      service.syncAll.mockResolvedValue(fullResult);

      const result = await controller.run();

      expect(result).toBe(fullResult);
      expect(service.syncAll).toHaveBeenCalledTimes(1);
    });

    it('returns 200 even when the run was skipped', async () => {
      const skipped: SyncRunResult = {
        ...fullResult,
        skippedReason: 'lock_held_by_other_replica',
      };
      service.syncAll.mockResolvedValue(skipped);

      // The @HttpCode(200) decorator is enforced at the framework
      // level; this test just confirms the controller doesn't
      // re-throw on skipped results.
      const result = await controller.run();

      expect(result.skippedReason).toBe('lock_held_by_other_replica');
    });
  });

  describe('POST /strategy-sync/backfill', () => {
    it('parses ISO timestamps and forwards to the service as Date instances', async () => {
      service.runBackfill.mockResolvedValue(fullResult);

      const result = await controller.backfill({
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-02-01T00:00:00.000Z',
      });

      expect(result).toBe(fullResult);
      expect(service.runBackfill).toHaveBeenCalledWith({
        start: new Date('2024-01-01T00:00:00.000Z'),
        end: new Date('2024-02-01T00:00:00.000Z'),
      });
    });

    it('throws BadRequestException when from/to are not ISO timestamps', async () => {
      await expect(
        controller.backfill({ from: 'nope', to: '2024-02-01T00:00:00.000Z' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.runBackfill).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when from >= to', async () => {
      await expect(
        controller.backfill({
          from: '2024-02-01T00:00:00.000Z',
          to: '2024-01-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.runBackfill).not.toHaveBeenCalled();
    });
  });
});
