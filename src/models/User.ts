import Model from './Model';

export interface IncomingApiData {
  id: number;
  email: string;
  name: string;
  role?: {
    name: string;
  } | string | null;
}

interface OutgoingApiData {
  email: IncomingApiData['email'];
}

export default class User extends Model {
  constructor(
    public id: number,
    public email: string,
    public name: string,
    public token: string,
    public role: string = 'admin'
  ) {
    super();
  }

  is(role: string) {
    return this.role === role;
  }

  can() {
    return true;
  }

  cant() {
    return false;
  }

  eitherCan() {
    return true;
  }

  cantDoAny() {
    return false;
  }

  static fromApiData(apiData: IncomingApiData, token: string): User {
    const roleName = typeof apiData.role === 'string' ? apiData.role : apiData.role?.name;
    return new User(apiData.id, apiData.email, apiData.name, token, roleName || 'admin');
  }

  static toApiData(user: User): OutgoingApiData {
    return {
      email: user.email
    };
  }
}
