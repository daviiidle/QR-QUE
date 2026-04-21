update products
set image_url = case name
  when 'Classic Milk Tea' then '/menu-images/classic-milk-tea.svg'
  when 'Taro Milk Tea' then '/menu-images/taro-milk-tea.svg'
  when 'Brown Sugar Milk' then '/menu-images/brown-sugar-milk.svg'
  when 'Passionfruit Green Tea' then '/menu-images/passionfruit-green-tea.svg'
  when 'Mango Green Tea' then '/menu-images/mango-green-tea.svg'
  when 'Matcha Latte' then '/menu-images/matcha-latte.svg'
  else image_url
end
where shop_id = '11111111-1111-1111-1111-111111111111'
  and name in (
    'Classic Milk Tea',
    'Taro Milk Tea',
    'Brown Sugar Milk',
    'Passionfruit Green Tea',
    'Mango Green Tea',
    'Matcha Latte'
  );
