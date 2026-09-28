import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;

  const validProduct = {
    name: 'Webcam',
    description: 'HD 1080p con micrófono',
    price: 32000,
    stock: 12,
  };

  // Una app nueva por test: el servicio guarda los productos en memoria, así que cada
  // caso arranca con los datos semilla y no hereda lo que hicieron los anteriores.
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /products', () => {
    it('should return the seeded products', async () => {
      const res = await request(app.getHttpServer()).get('/products').expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toMatchObject({ id: 1, name: 'Teclado mecánico' });
    });
  });

  describe('GET /products/:id', () => {
    it('should return the requested product', async () => {
      const res = await request(app.getHttpServer()).get('/products/2').expect(200);

      expect(res.body).toMatchObject({ id: 2, name: 'Mouse inalámbrico' });
    });

    it('should return 404 for an unknown id', async () => {
      const res = await request(app.getHttpServer()).get('/products/999').expect(404);

      expect(res.body.message).toBe('Product #999 not found');
    });
  });

  describe('POST /products', () => {
    it('should create the product and return 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send(validProduct)
        .expect(201);

      expect(res.body).toMatchObject(validProduct);
      expect(res.body.id).toBeGreaterThan(0);
    });

    // Este bloque es el que antes no se podía probar: sin el ValidationPipe la app de
    // test aceptaba cualquier body y devolvía 201.
    describe('validation', () => {
      it('should reject a body with wrong types', async () => {
        await request(app.getHttpServer())
          .post('/products')
          .send({ name: 123, description: 'x', price: 'no-es-numero', stock: -5 })
          .expect(400);
      });

      it('should reject a body with missing fields', async () => {
        await request(app.getHttpServer()).post('/products').send({ name: 'Solo nombre' }).expect(400);
      });

      it('should reject a negative price', async () => {
        await request(app.getHttpServer())
          .post('/products')
          .send({ ...validProduct, price: -1 })
          .expect(400);
      });

      it('should report which field failed', async () => {
        const res = await request(app.getHttpServer())
          .post('/products')
          .send({ ...validProduct, stock: -5 })
          .expect(400);

        expect(res.body.message.join(' ')).toContain('stock');
      });

      it('should not persist a rejected product', async () => {
        await request(app.getHttpServer()).post('/products').send({ name: 'Invalido' }).expect(400);

        const res = await request(app.getHttpServer()).get('/products').expect(200);
        expect(res.body).toHaveLength(3);
      });
    });
  });

  describe('PATCH /products/:id', () => {
    it('should apply a partial update', async () => {
      const res = await request(app.getHttpServer())
        .patch('/products/1')
        .send({ price: 50000 })
        .expect(200);

      expect(res.body).toMatchObject({ id: 1, price: 50000, name: 'Teclado mecánico' });
    });

    it('should return 404 for an unknown id', async () => {
      await request(app.getHttpServer()).patch('/products/999').send({ price: 1 }).expect(404);
    });

    it('should validate the body', async () => {
      await request(app.getHttpServer()).patch('/products/1').send({ price: 'gratis' }).expect(400);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should remove the product', async () => {
      await request(app.getHttpServer()).delete('/products/1').expect(200);

      await request(app.getHttpServer()).get('/products/1').expect(404);
    });

    it('should return 404 for an unknown id', async () => {
      await request(app.getHttpServer()).delete('/products/999').expect(404);
    });
  });

  describe('full lifecycle', () => {
    it('should create, read, update and delete a product', async () => {
      const created = await request(app.getHttpServer())
        .post('/products')
        .send(validProduct)
        .expect(201);
      const { id } = created.body;

      await request(app.getHttpServer()).get(`/products/${id}`).expect(200);

      const updated = await request(app.getHttpServer())
        .patch(`/products/${id}`)
        .send({ stock: 0 })
        .expect(200);
      expect(updated.body.stock).toBe(0);

      await request(app.getHttpServer()).delete(`/products/${id}`).expect(200);
      await request(app.getHttpServer()).get(`/products/${id}`).expect(404);
    });
  });
});
