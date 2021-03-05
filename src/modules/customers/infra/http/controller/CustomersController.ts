import { Request, Response } from 'express';

import ICreateCustomerDTO from '@modules/customers/dtos/ICreateCustomerDTO';
import CreateCustomerService from '@modules/customers/services/CreateCustomerService';

import { container } from 'tsyringe';

export default class CustomersController {
  public async create(
    request: Request<{}, {}, ICreateCustomerDTO>,
    response: Response,
  ): Promise<Response> {
    const { email, name } = request.body;

    const createCustomer = container.resolve(CreateCustomerService);

    const customer = await createCustomer.execute({ email, name });

    return response.json(customer);
  }
}
