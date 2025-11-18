import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Phone, ArrowLeft } from 'lucide-react';
import { MainLayout } from '../components/layout';
import { Card, Button, Spinner } from '../components/common';
import { useAuth } from '../hooks';
import { extensionService, tollFreeNumberService } from '../api';
import routingService from '../api/routingService';

const RoutingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [numbers, setNumbers] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingFor, setSavingFor] = useState(null);
  const [selectedMap, setSelectedMap] = useState({});
  const [templateMap, setTemplateMap] = useState({});
  const [savedMap, setSavedMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const numsRes = await tollFreeNumberService.getMyNumbers();
      const exRes = await extensionService.getMyExtensions();
      const tempRes = await routingService.getTemplates();
  const myNumbers = numsRes.data || [];
  const myExts = exRes.data || [];
  const myTemplates = tempRes.data || [];

      setNumbers(myNumbers);
      setExtensions(myExts);
      setTemplates(myTemplates);

      // Initialize selected map with existing forwardToExtension if present
      const initialMap = {};
      const initialTemplateMap = {};
      myNumbers.forEach((n) => {
        if (n.config && n.config.forwardToExtension) initialMap[n.id] = n.config.forwardToExtension;
        if (n.config && n.config.template) initialTemplateMap[n.id] = n.config.template;
      });
      setSelectedMap(initialMap);
      setTemplateMap(initialTemplateMap);
      // Initialize saved map timestamps as null
      const initialSaved = {};
      myNumbers.forEach((n) => {
        if (n.config && n.config.forwardToExtension) {
          // prefer server updatedAt if available for accurate timestamp
          const ts = n.updatedAt ? new Date(n.updatedAt).getTime() : Date.now();
          initialSaved[n.id] = ts;
        }
      });
      setSavedMap(initialSaved);
    } catch (error) {
      console.error('Error loading routing data', error);
      toast.error('Failed to load routing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (numberId, ext) => {
    console.log('[RoutingPage] select extension', { numberId, extension: ext });
    setSelectedMap((m) => ({ ...m, [numberId]: ext }));
  };

  const handleTemplateSelect = (numberId, template) => {
    console.log('[RoutingPage] select template', { numberId, template });
    setTemplateMap((m) => ({ ...m, [numberId]: template }));
  };

  const handleSave = async (numberId) => {
    const ext = selectedMap[numberId];
    const template = templateMap[numberId] || 'incoming_generic';
    const templateInfo = templates.find(t => t.id === template);
    
    if (templateInfo?.placeholders.includes('extension') && !ext) {
      toast.error('Please select an extension first');
      return;
    }
    
    // If the selection matches current mapping, skip
    const current = numbers.find((n) => n.id === numberId)?.config?.forwardToExtension;
    const currentTemplate = numbers.find((n) => n.id === numberId)?.config?.template || 'incoming_generic';
    const extChanged = templateInfo?.placeholders.includes('extension') ? (current !== ext) : false;
    const templateChanged = currentTemplate !== template;
    
    if (!extChanged && !templateChanged) {
      toast('No changes to save');
      return;
    }
    
    try {
      console.log('[RoutingPage] saving mapping', { numberId, extension: ext, template });
      setSavingFor(numberId);
      const result = await routingService.setMapping(numberId, ext, template);
      console.log('[RoutingPage] setMapping result', result);
      toast.success('Routing saved');
  // Mark as saved using server timestamp if available, else now
  const serverTs = result?.tollFreeNumber?.updatedAt ? new Date(result.tollFreeNumber.updatedAt).getTime() : Date.now();
  setSavedMap((s) => ({ ...s, [numberId]: serverTs }));
  setNumbers((list) => list.map((n) => (n.id === numberId ? { ...n, config: { ...(n.config || {}), forwardToExtension: ext, template }, updatedAt: result?.tollFreeNumber?.updatedAt || n.updatedAt } : n)));
      // refresh backend-backed data in background
      fetchData();
    } catch (error) {
      console.error('[RoutingPage] Failed to save routing', error);
      toast.error('Failed to save routing');
    } finally {
      setSavingFor(null);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900 mb-2 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <h1 className="text-2xl font-bold">Call Routing</h1>
            <p className="text-gray-600">Map your toll-free numbers to extensions for test routing.</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>Refresh</Button>
          </div>
        </div>

        {numbers.length === 0 ? (
          <Card className="text-center p-8">
            <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700">You have no assigned toll-free numbers.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {numbers.map((num) => (
              <Card key={num.id} className="p-6">
                <h3 className="text-lg font-semibold mb-2">{num.number}</h3>
                <p className="text-sm text-gray-600 mb-4">Status: {num.status}</p>

                {num.config?.forwardToExtension && (
                  <div className="mb-3 text-sm">
                    <span className="font-medium text-gray-700">Currently forwarding to:</span>
                    <span className="ml-2 text-green-700 font-semibold">{num.config.forwardToExtension}</span>
                    {num.config?.template && (
                      <span className="ml-2 text-xs text-blue-600">({templates.find(t => t.id === num.config.template)?.name || num.config.template})</span>
                    )}
                    {savedMap[num.id] ? (
                      <span className="ml-3 text-xs text-green-600">Saved ✓ {new Date(savedMap[num.id]).toLocaleTimeString()}</span>
                    ) : null}
                  </div>
                )}

                <label className="block text-sm font-medium text-gray-700 mb-2">Dialplan Template</label>
                <select
                  value={templateMap[num.id] || 'incoming_generic'}
                  onChange={(e) => handleTemplateSelect(num.id, e.target.value)}
                  className="w-full border rounded p-2 mb-4"
                  disabled={templates.length === 0}
                >
                  {templates.length === 0 ? (
                    <option value="">Loading templates...</option>
                  ) : (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))
                  )}
                </select>

                <label className="block text-sm font-medium text-gray-700 mb-2">Forward to extension</label>
                {templates.find(t => t.id === (templateMap[num.id] || 'incoming_generic'))?.placeholders.includes('extension') ? (
                  <select
                    value={selectedMap[num.id] || ''}
                    onChange={(e) => handleSelect(num.id, e.target.value)}
                    className="w-full border rounded p-2 mb-4"
                  >
                    <option value="">-- Select extension --</option>
                    {extensions.map((ex) => (
                      <option key={ex.id} value={ex.extension}>{ex.extension} {ex.displayName ? `- ${ex.displayName}` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full border rounded p-2 mb-4 bg-gray-50 text-gray-500 text-sm">
                    This template does not require extension selection
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button onClick={() => handleSave(num.id)} disabled={savingFor === num.id || (() => {
                    const template = templateMap[num.id] || 'incoming_generic';
                    const templateInfo = templates.find(t => t.id === template);
                    const current = numbers.find((n) => n.id === num.id)?.config?.forwardToExtension;
                    const currentTemplate = numbers.find((n) => n.id === num.id)?.config?.template || 'incoming_generic';
                    const extChanged = templateInfo?.placeholders.includes('extension') ? (current !== selectedMap[num.id]) : false;
                    const templateChanged = currentTemplate !== template;
                    return !extChanged && !templateChanged;
                  })()}>
                    {savingFor === num.id ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RoutingPage;
