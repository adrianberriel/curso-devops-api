import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  let service: ProductsService;

  // El servicio guarda los productos en memoria. Test.createTestingModule construye
  // una instancia nueva en cada test, así que todos arrancan con los datos semilla
  // intactos y no hay que limpiar estado entre uno y otro.
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return every seeded product', () => {
      const products = service.findAll();

      expect(products).toHaveLength(3);
      expect(products.map((p) => p.id)).toEqual([1, 2, 3]);
    });
  });

  describe('findOne', () => {
    it('should return the product matching the id', () => {
      expect(service.findOne(2)).toMatchObject({ id: 2, name: 'Mouse inalámbrico' });
    });

    it('should throw NotFoundException when the id does not exist', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
    });

    it('should name the missing id in the error message', () => {
      expect(() => service.findOne(999)).toThrow('Product #999 not found');
    });
  });

  describe('create', () => {
    const dto = { name: 'Webcam', description: 'HD 1080p', price: 32000, stock: 12 };

    it('should return the new product with a generated id', () => {
      expect(service.create(dto)).toEqual({ id: 4, ...dto });
    });

    it('should make the new product retrievable', () => {
      const created = service.create(dto);

      expect(service.findAll()).toHaveLength(4);
      expect(service.findOne(created.id)).toMatchObject(dto);
    });

    it('should assign consecutive ids', () => {
      expect(service.create(dto).id).toBe(4);
      expect(service.create(dto).id).toBe(5);
    });
  });

  describe('update', () => {
    it('should apply the given fields', () => {
      expect(service.update(1, { price: 50000 }).price).toBe(50000);
    });

    it('should leave the fields that were not sent untouched', () => {
      const before = { ...service.findOne(1) };

      const updated = service.update(1, { price: 50000 });

      expect(updated.name).toBe(before.name);
      expect(updated.description).toBe(before.description);
      expect(updated.stock).toBe(before.stock);
    });

    it('should persist the change', () => {
      service.update(1, { stock: 0 });

      expect(service.findOne(1).stock).toBe(0);
    });

    it('should throw NotFoundException when the id does not exist', () => {
      expect(() => service.update(999, { price: 1 })).toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the product', () => {
      service.remove(1);

      expect(service.findAll()).toHaveLength(2);
      expect(() => service.findOne(1)).toThrow(NotFoundException);
    });

    it('should leave the other products in place', () => {
      service.remove(1);

      expect(service.findAll().map((p) => p.id)).toEqual([2, 3]);
    });

    it('should throw NotFoundException when the id does not exist', () => {
      expect(() => service.remove(999)).toThrow(NotFoundException);
    });
  });
});
