const Navbar = () => {

    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Harshana</h1>
          <ul className="flex space-x-6 text-gray-700 dark:text-gray-300">
            <li><a href="#hero" className="hover:text-blue-500">Home</a></li>
            <li><a href="#about" className="hover:text-blue-500">About</a></li>
            <li><a href="#projects" className="hover:text-blue-500">Projects</a></li>
            <li><a href="#contact" className="hover:text-blue-500">Contact</a></li>
          </ul>
        </div>
      </nav>
    )
  }

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };
  
  <button
    onClick={toggleDarkMode}
    className="ml-4 bg-gray-200 dark:bg-gray-700 text-sm px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
  >
    Toggle Theme
  </button>
  
  export default Navbar
  