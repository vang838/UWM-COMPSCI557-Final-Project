from rest_framework.permissions import BasePermission

# Permissions.py checks what role a user has

class isAdmin(BasePermission):
    def has_permission(self, request, view): # Allow access to users with admin role
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class isStandardUser(BasePermission):
    def has_permission(self, request, view): # Allow access only to users with standard user role
        return request.user and request.user.is_authenticated and request.user.role == 'user'

class isAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view): # Allow read only reqs for any authenticated user
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'admin' # Allow write reqs only for admins