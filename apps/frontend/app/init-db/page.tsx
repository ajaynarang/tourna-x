'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Alert, AlertDescription } from '@repo/ui';
import { Database, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function InitDbPage() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const clearDatabase = async () => {
    setIsClearing(true);
    setResult(null);
    try {
      const response = await fetch('/api/init-db', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({ type: 'success', message: data.message });
      } else {
        setResult({ type: 'error', message: data.error });
      }
    } catch (error) {
      setResult({ type: 'error', message: `Network error: ${error}` });
    } finally {
      setIsClearing(false);
    }
  };

  const initializeDatabase = async () => {
    setIsInitializing(true);
    setResult(null);
    try {
      const response = await fetch('/api/init-db', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({ type: 'success', message: data.message });
      } else {
        setResult({ type: 'error', message: data.error });
      }
    } catch (error) {
      setResult({ type: 'error', message: `Network error: ${error}` });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">Database Management</CardTitle>
            <CardDescription className="text-lg text-slate-600">
              Manage your database with sample data for testing and development
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Warning Alert */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Warning:</strong> These operations will modify your database. Use with caution in production environments.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  Clear Database
                </h3>
                <p className="text-sm text-slate-600">
                  Remove all data from the database. This will delete all users, tournaments, and related data.
                </p>
                <Button 
                  onClick={clearDatabase}
                  disabled={isClearing || isInitializing}
                  variant="destructive"
                  className="w-full"
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Database
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Initialize Database
                </h3>
                <p className="text-sm text-slate-600">
                  Create sample data including admin user (dual role), player user, and 2 tournaments.
                </p>
                <Button 
                  onClick={initializeDatabase}
                  disabled={isInitializing || isClearing}
                  className="w-full"
                >
                  {isInitializing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Initialize Database
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Result Display */}
            {result && (
              <Alert className={result.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className={result.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  <strong>{result.type === 'success' ? '✅ Success:' : '❌ Error:'}</strong> {result.message}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Sample Data Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">Sample Data Created:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>Admin User:</strong> admin@tourna-x.com / +919876543210 (roles: admin + player)</li>
                <li>• <strong>Player User:</strong> player@example.com / +919876543211 (role: player)</li>
                <li>• <strong>Spring Badminton Championship:</strong> Open tournament, registration open</li>
                <li>• <strong>Society Tennis Tournament:</strong> Society-only tournament, published</li>
              </ul>
            </div>

            {/* Environment Setup */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Environment Setup:</h4>
              <p className="text-sm text-blue-800 mb-2">Make sure to set your MongoDB connection string in the .env file:</p>
              <code className="block text-xs bg-blue-100 p-2 rounded text-blue-900">
                MONGODB_URI=mongodb://localhost:27017<br/>
                MONGODB_DATABASE=tourna-x
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
