return {
  -- Fugitive
  {
    "tpope/vim-fugitive",
  },

  -- Gitsigns
  {
    "lewis6991/gitsigns.nvim",
    config = function()
      require("gitsigns").setup()
      vim.keymap.set("n", "tg", ":Gitsigns toggle_current_line_blame<CR>")
      vim.keymap.set("n", "pb", ":Gitsigns preview_hunk_inline<CR>")
    end,
  },
}
