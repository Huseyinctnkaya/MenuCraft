import { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Copy, Trash2, Eye, EyeOff, Edit, Settings } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export default function MegaMenusList() {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
  const [menus] = useState([
    { id: 1, name: 'Main Navigation', status: 'active', items: 12, views: 1250 },
    { id: 2, name: 'Footer Menu', status: 'draft', items: 8, views: 0 },
    { id: 3, name: 'Mobile Menu', status: 'active', items: 15, views: 890 }
  ]);

  const handleOpenDropdown = (menuId: number) => {
    const button = buttonRefs.current[menuId];
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      });
      setOpenMenuId(menuId);
    }
  };

  useEffect(() => {
    const currentRef = buttonRefs.current[openMenuId as number];
    const handleClickOutside = (event: MouseEvent) => {
      if (currentRef && !currentRef.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-900">Mega Menus</h1>
            <p className="text-gray-600 mt-1">Manage all your navigation menus</p>
          </div>
          <Button onClick={() => navigate('/builder')}>
            <Plus className="w-4 h-4" />
            Create New Menu
          </Button>
        </div>

        {/* Menus List */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600">Menu Name</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600">Items</th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600">Views</th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <button 
                        className="text-sm text-gray-900 hover:text-indigo-600"
                        onClick={() => navigate(`/builder/${menu.id}`)}
                      >
                        {menu.name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={menu.status === 'active' ? 'success' : 'default'}>
                        {menu.status === 'active' ? (
                          <><Eye className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><EyeOff className="w-3 h-3 mr-1" /> Draft</>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{menu.items}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{menu.views.toLocaleString()}</td>
                    <td className="px-6 py-4 relative">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/builder/${menu.id}`)}>
                          Customize
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            ref={(el) => buttonRefs.current[menu.id] = el}
                            onClick={() => handleOpenDropdown(menu.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          
                          {/* Dropdown Menu */}
                          {openMenuId === menu.id && (
                            <>
                              {/* Backdrop to close dropdown */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              
                              {/* Dropdown - Fixed Position */}
                              <div 
                                className="fixed w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
                                style={{ 
                                  top: `${dropdownPosition.top}px`, 
                                  right: `${dropdownPosition.right}px` 
                                }}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      navigate(`/builder/${menu.id}`);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Edit Menu
                                  </button>
                                  <button
                                    onClick={() => {
                                      alert('Duplicate menu: ' + menu.name);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Duplicate
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate('/appearance');
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                  </button>
                                  <div className="border-t border-gray-200 my-1" />
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this menu?')) {
                                        alert('Delete menu: ' + menu.name);
                                      }
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Menu
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {menus.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No menus yet. Create your first one!</p>
              <Button onClick={() => navigate('/builder')}>
                <Plus className="w-4 h-4" />
                Create Menu
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}