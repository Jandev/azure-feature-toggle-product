'use client'

import { useState, useEffect } from 'react'
import { ResourceList } from '@/components/resources'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { AppConfigResource } from '@/types'

export default function ResourcesPage() {
  const [resources, setResources] = useState<AppConfigResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<AppConfigResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch resources on mount
  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/resources')
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }
      
      const data = await response.json()
      setResources(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching resources:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    // Navigate to add page (will implement)
    window.location.href = '/resources/add'
  }

  const handleEdit = (resource: AppConfigResource) => {
    // Navigate to edit page (will implement)
    window.location.href = `/resources/edit/${resource.id}`
  }

  const handleDeleteClick = (resource: AppConfigResource) => {
    setResourceToDelete(resource)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/resources/${resourceToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete resource')
      }

      // Refresh the list
      await fetchResources()
      setDeleteConfirmOpen(false)
      setResourceToDelete(null)
    } catch (err) {
      console.error('Error deleting resource:', err)
      alert('Failed to delete resource. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent mb-4"></div>
          <p className="text-slate-600">Loading resources...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Resources</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={fetchResources}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Azure App Configuration Resources</h1>
          <p className="text-slate-600 mt-1">
            Manage connections to your Azure App Configuration resources
          </p>
        </div>
        <Button onClick={handleAddNew} size="lg">
          Add Resource
        </Button>
      </div>

      {/* Resource List */}
      <ResourceList
        resources={resources}
        onAdd={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resource connection for{' '}
              <span className="font-semibold">{resourceToDelete?.displayName}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
