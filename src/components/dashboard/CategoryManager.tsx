import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Trash2, Plus } from 'lucide-react';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const ICON_OPTIONS = ['📝', '🍽️', '🚗', '🎬', '🏥', '🛍️', '⚡', '📚', '✈️', '💰', '🏠', '💳', '📱', '⛽', '🎮', '🏋️', '🎨', '🐕', '🌿', '🎁'];

export function CategoryManager() {
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📝');
  const { customCategories, addCategory, deleteCategory } = useExpenseCategories();

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const result = await addCategory(newCategoryName, selectedIcon);
    if (result?.success) {
      setNewCategoryName('');
      setSelectedIcon('📝');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Add custom expense categories or remove the ones you don't need
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Category */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Gym Membership"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>

            <div className="grid gap-2">
              <Label>Select Icon</Label>
              <div className="grid grid-cols-10 gap-2">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`text-2xl p-2 rounded hover:bg-accent transition-colors ${
                      selectedIcon === icon ? 'bg-accent ring-2 ring-primary' : ''
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleAddCategory} 
              className="w-full"
              disabled={!newCategoryName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Custom Categories List */}
          {customCategories.length > 0 && (
            <div className="space-y-2">
              <Label>Your Custom Categories</Label>
              <ScrollArea className="h-[200px] border rounded-lg p-4">
                <div className="space-y-2">
                  {customCategories.map(category => (
                    <div 
                      key={category.id} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}