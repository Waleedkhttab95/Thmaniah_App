db = db.getSiblingDB('admin');
db.auth('root', 'example');

// Create auth database and user
db = db.getSiblingDB('auth');
db.createUser({
  user: 'auth_user',
  pwd: 'auth_password',
  roles: [
    {
      role: 'readWrite',
      db: 'auth'
    }
  ]
});

// Create content database and user
db = db.getSiblingDB('content');
db.createUser({
  user: 'content_user',
  pwd: 'content_password',
  roles: [
    {
      role: 'readWrite',
      db: 'content'
    }
  ]
});

// Create discovery database and user
db = db.getSiblingDB('discovery');
db.createUser({
  user: 'discovery_user',
  pwd: 'discovery_password',
  roles: [
    {
      role: 'readWrite',
      db: 'discovery'
    }
  ]
}); 