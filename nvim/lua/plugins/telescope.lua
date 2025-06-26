return 
{
  -- Telescope Fuzzy Finder  
    "nvim-telescope/telescope.nvim",
    tag = "0.1.8",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      require("telescope").setup()
      local builtin = require('telescope.builtin')
      
      -- Findfiles keymap Ctrl+l
      vim.keymap.set('n', '<C-l>', builtin.find_files, {}) 
    
      -- Livegrep keymap Ctrl+k
      vim.keymap.set('n', '<C-k>', builtin.live_grep, {})

      -- Buffers keymap fb
      vim.keymap.set('n', 'fb', builtin.buffers, {})
    end,
}
