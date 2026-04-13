export default function Landing({ user }) {
  return (
    <div className="text-center animate-fade-in max-w-lg w-full">
      <div className="mb-8">
        {user.picture ? (
          <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-2xl mx-auto ring-4 ring-primary-500/20 shadow-2xl shadow-primary-500/10" />
        ) : (
          <div className="w-24 h-24 rounded-2xl mx-auto ring-4 ring-primary-500/20 bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-surface-100 mb-2">
        Welcome, <span className="gradient-text">{user.name.split(' ')[0]}</span>!
      </h1>
      <p className="text-surface-400 text-lg mb-2">{user.email}</p>
      <span className="inline-block px-3 py-1 rounded-full bg-accent-500/15 text-accent-400 text-xs font-semibold border border-accent-500/20 uppercase tracking-wider">
        {user.role}
      </span>

      <div className="mt-10 glass rounded-2xl p-6 text-left">
        <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Your Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-surface-800/50">
            <span className="text-sm text-surface-500">Name</span>
            <span className="text-sm font-medium text-surface-200">{user.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-surface-800/50">
            <span className="text-sm text-surface-500">Email</span>
            <span className="text-sm font-medium text-surface-200">{user.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-surface-500">Role</span>
            <span className="text-sm font-medium text-surface-200">{user.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
