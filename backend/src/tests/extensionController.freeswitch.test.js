const controller = require('../controllers/extensionController');

jest.mock('../models', () => ({
  Extension: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../services/kamailioService', () => ({
  getExtensionActiveCalls: jest.fn(),
}));

jest.mock('../services/freeswitchService', () => ({
  getExtensionActiveCalls: jest.fn(),
}));

const { Extension } = require('../models');
const kamailioService = require('../services/kamailioService');
const freeswitchService = require('../services/freeswitchService');

describe('extensionController.getExtensionActiveCalls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('falls back to FreeSWITCH when Kamailio fails', async () => {
    const req = { params: { id: 'ext-1' } };
    const res = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Extension exists
    Extension.findByPk.mockResolvedValue({ id: 'ext-1' });

    // Kamailio throws
    kamailioService.getExtensionActiveCalls.mockImplementation(() => {
      throw new Error('relation "Extension" does not exist');
    });

    // FreeSWITCH returns calls
    const calls = [ { callId: 'c1', from: '1001', to: '1002' } ];
    freeswitchService.getExtensionActiveCalls.mockResolvedValue(calls);

    await controller.getExtensionActiveCalls(req, res);

    expect(Extension.findByPk).toHaveBeenCalledWith('ext-1');
    expect(kamailioService.getExtensionActiveCalls).toHaveBeenCalledWith('ext-1');
    expect(freeswitchService.getExtensionActiveCalls).toHaveBeenCalledWith('ext-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: expect.anything() }));
    const sent = res.json.mock.calls[0][0];
    expect(sent.data.activeCalls).toEqual(calls);
  });
});
