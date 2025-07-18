return {
  "nvimdev/lspsaga.nvim",
  config = function()
    require("lspsaga").setup({
      ui = {
        border = "single",
        title = true,
        code_action = ""
      },
      symbol_in_winbar = {
        enable = true,
        separator = "->",
      },
      definition = {
        width = 0.6,
        height = 0.5,
      },
    })

    -- Keymap
    vim.keymap.set("n", "ca", ":Lspsaga code_action<CR>")
    vim.keymap.set("n", "gd", ":Lspsaga goto_definition<CR>")
    vim.keymap.set("n", "ld", ":Lspsaga show_line_diagnostics<CR>")
    vim.keymap.set("n", "bd", ":Lspsaga show_buf_diagnostics<CR>")
    vim.keymap.set("n", "pd", ":Lspsaga peek_definition<CR>")
    vim.keymap.set('n', "ff", ":Lspsaga finder<CR>")
    vim.keymap.set('n', "hd", ":Lspsaga hover_doc<CR>")
    vim.keymap.set('n', "rr", ":Lspsaga rename<CR>")
    vim.keymap.set('n', "ot", ":Lspsaga outline<CR>")
  end,
  -- dependencies = {
  --   "nvim-treesitter/nvim-treesitter", -- optional
  --   "nvim-tree/nvim-web-devicons",  -- optional
  -- },
}
