import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './entities/product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  private products: Product[] = [
    {
      id: 1,
      name: 'Teclado mecánico',
      description: 'Switches azules, retroiluminado',
      price: 45000,
      stock: 15,
    },
    {
      id: 2,
      name: 'Mouse inalámbrico',
      description: 'Sensor óptico 1600 DPI',
      price: 18000,
      stock: 30,
    },
    {
      id: 3,
      name: 'Monitor 24"',
      description: 'Full HD, 75Hz',
      price: 120000,
      stock: 8,
    },
  ];
  private nextId = 4;

  create(createProductDto: CreateProductDto) {
    const product: Product = { id: this.nextId++, ...createProductDto };
    this.products.push(product);
    return product;
  }

  findAll() {
    return this.products;
  }

  findOne(id: number) {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    const product = this.findOne(id);
    Object.assign(product, updateProductDto);
    return product;
  }

  remove(id: number) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    this.products.splice(index, 1);
  }
}
