import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({
    customer_id,
    products: productsToAdd,
  }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const products = await this.productsRepository.findAllById(productsToAdd);

    if (!products || !products.length) {
      throw new AppError('Products not found');
    }

    const productsToUpdate = products.map(product => {
      const productToAdd = productsToAdd.find(p => p.id === product.id);
      if (!productToAdd) {
        throw new AppError('Error on processing your order products');
      }

      if (productToAdd.quantity > product.quantity) {
        throw new AppError('There is not enough products to your order');
      }
      return {
        ...product,
        quantity: product.quantity - productToAdd.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: products.map(({ id: product_id, price }) => ({
        price,
        product_id,
        quantity: productsToAdd.find(product => product.id === product_id)
          ?.quantity as number,
      })),
    });

    await this.productsRepository.updateQuantity(productsToUpdate);

    return order;
  }
}

export default CreateOrderService;
