import { CrudConfigService } from '@nestjsx/crud';

CrudConfigService.load({
  query: {
    limit: 10,
    maxLimit: 100,
    alwaysPaginate: true,
    cache: 3000,
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  routes: {
    only: [
      'getManyBase',
      'getOneBase',
      'createOneBase',
      'updateOneBase',
      'deleteOneBase',
    ],
    getManyBase: {
      interceptors: [], // Có thể thêm logging/interceptor toàn cục
    },
    createOneBase: {
      interceptors: [],
    },
    updateOneBase: {
      allowParamsOverride: false, // Ngăn update sai id
    },
    deleteOneBase: {
      returnDeleted: true,
    },
  },
});
