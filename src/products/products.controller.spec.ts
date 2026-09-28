import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { Product } from './entities/product.entity.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: Record<keyof ProductsService, ReturnType<typeof vi.fn>>;

  const product: Product = {
    id: 2,
    name: 'Mouse inalámbrico',
    description: 'Sensor óptico 1600 DPI',
    price: 18000,
    stock: 30,
  };

  // El servicio va mockeado: lo que importa acá es que el controlador delegue con los
  // argumentos correctos, no la lógica del CRUD, que ya cubre products.service.spec.ts.
  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should pass the body through and return the created product', () => {
      const dto = { name: 'Webcam', description: 'HD 1080p', price: 32000, stock: 12 };
      service.create.mockReturnValue(product);

      expect(controller.create(dto)).toBe(product);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return the list from the service', () => {
      service.findAll.mockReturnValue([product]);

      expect(controller.findAll()).toEqual([product]);
    });
  });

  // El id llega como string desde la URL y el servicio espera un number: la conversión
  // es la única lógica propia del controlador, así que se verifica en cada ruta con :id.
  describe('id conversion', () => {
    it('should convert the id to a number on findOne', () => {
      service.findOne.mockReturnValue(product);

      expect(controller.findOne('2')).toBe(product);
      expect(service.findOne).toHaveBeenCalledWith(2);
    });

    it('should convert the id to a number on update', () => {
      const dto = { price: 19000 };
      service.update.mockReturnValue(product);

      expect(controller.update('2', dto)).toBe(product);
      expect(service.update).toHaveBeenCalledWith(2, dto);
    });

    it('should convert the id to a number on remove', () => {
      controller.remove('2');

      expect(service.remove).toHaveBeenCalledWith(2);
    });

    it('should pass a number, not a numeric string', () => {
      controller.findOne('2');

      const [id] = service.findOne.mock.calls[0];
      expect(id).toBe(2);
      expect(typeof id).toBe('number');
    });
  });
});
