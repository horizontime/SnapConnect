-- Create test stories for non-friend users to populate the recommended feed
INSERT INTO stories (user_id, media_url, thumbnail_url, type, title, description, expires_at)
VALUES 
  -- Chris's story 1
  ('7b2e791a-d5ba-4605-991e-f86cd90b9a2d', 
   'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800', 
   'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400',
   'image', 
   'Rustic Oak Bookshelf', 
   'I just put the finishing touches on this rustic bookshelf, crafted from solid red oak. The project was a labor of love, starting with carefully selected planks that had just the right amount of character and knots. I wanted to maintain a natural, rugged look, so I focused on traditional joinery techniques. The shelves are set into dadoes routed into the uprights, providing incredible strength and a clean look without visible hardware.

For the joinery, I used my trusty set of chisels and a Japanese pull saw to cut the mortise and tenon joints for the frame. This ensures the bookshelf is incredibly sturdy and will last for generations. The most challenging part was getting the tenon shoulders perfectly square, but the result was worth the effort. The back is made of oak plywood to add stability and prevent racking.

To finish it, I applied several coats of tung oil. This really brought out the deep, warm tones of the oak and highlighted the beautiful grain patterns. Unlike polyurethane, tung oil gives it a more natural, matte finish that feels great to the touch. It''s a piece that not only serves a purpose but also tells a story of craftsmanship.',
   NOW() + INTERVAL '24 hours'),
   
  -- Drew's story
  ('eb50e6d7-a60f-4a28-b879-5c9efb64241a',
   'https://images.unsplash.com/photo-1594736341253-35f6a91f5403?w=800',
   'https://images.unsplash.com/photo-1594736341253-35f6a91f5403?w=400', 
   'image',
   'Hand-Carved Cedar Rocking Chair',
   'This project has been on my bucket list for years: a hand-carved rocking chair made from aromatic cedar. The scent in the workshop has been absolutely incredible throughout the build. I started by shaping the rockers, which was a fun challenge involving the bandsaw and a lot of spokeshave work to get the curve just right. The legs were turned on the lathe, and I incorporated some subtle decorative beads.

The seat is coopered from several pieces of cedar, which I then sculpted with an angle grinder and a carving disc, followed by a lot of sanding to create a comfortable saddle shape. Every part of this chair was shaped by hand, from the spindles to the crest rail. The back spindles were particularly enjoyable to carve, each with a slight, unique variation that adds to the chair''s character.

I used mortise and tenon joinery throughout, drilling the holes for the legs and spindles at compound angles to get the right splay and rake. This was probably the most mentally taxing part of the build, requiring careful measurement and layout. The final chair is finished with a simple oil and wax blend to protect the wood while letting the natural color and aroma of the cedar shine through.',
   NOW() + INTERVAL '24 hours'),
   
  -- Jack's story  
  ('68a422f4-b81d-40f0-9a35-351f00cb6978',
   'https://images.unsplash.com/photo-1618215945244-c3a7c4915043?w=800',
   'https://images.unsplash.com/photo-1618215945244-c3a7c4915043?w=400',
   'image', 
   'Mahogany Coasters with Epoxy Inlays',
   'Here''s a small weekend project: a set of mahogany coasters with a vibrant blue epoxy inlay. I had some leftover mahogany from a larger build and thought this would be a great way to use it up. I started by cutting the coaster blanks to size and then used a small trim router to carve out a geometric pattern on each one.

Mixing and pouring the epoxy was the fun part. I used a metallic blue pigment to give it some shimmer and depth. After pouring, I used a heat gun to pop any air bubbles to ensure a crystal-clear finish. The epoxy took about 24 hours to cure fully.

Once cured, I ran the coasters through the drum sander to get them perfectly flat and flush with the wood surface. Then I sanded them up to a high grit and finished them with a food-safe hardwax oil. It gives them a durable, water-resistant finish while making the mahogany grain pop. They make a great gift!',
   NOW() + INTERVAL '24 hours'),
   
  -- Mike's story
  ('0514d55c-8556-4dc4-aef8-1a2ebbf731cf',
   'https://images.unsplash.com/photo-1621998539958-54379b18343d?w=800',
   'https://images.unsplash.com/photo-1621998539958-54379b18343d?w=400',
   'image',
   'Cherry Wood Jewelry Box', 
   'I just completed this delicate jewelry box, made from American cherry wood with maple splines for contrast. The rich, reddish-brown hue of the cherry is one of my favorites to work with. The box features mitered corners reinforced with the maple splines, which not only add strength but also a nice decorative touch. I used a table saw jig to cut the miters and a splining jig to cut the slots for the splines.

The lid is a frame-and-panel construction with a bookmatched cherry panel that has a beautiful flame-like grain pattern. The inside is lined with a soft, plush velvet to protect whatever is stored inside. I also added a small, removable tray with dividers for organizing smaller items like rings and earrings.

For the finish, I opted for several coats of shellac, which I French polished to a high gloss. This technique really brings out the chatoyance in the cherry wood and gives it a very refined, elegant look. It was a meticulous process, but the final result is a beautiful heirloom-quality piece.',
   NOW() + INTERVAL '24 hours'),

  -- Chris's story 2
  ('7b2e791a-d5ba-4605-991e-f86cd90b9a2d',
   'https://images.unsplash.com/photo-1518992028580-5d52b1f83191?w=800',
   'https://images.unsplash.com/photo-1518992028580-5d52b1f83191?w=400',
   'image',
   'Classic Pine Wood Birdhouse',
   'Sometimes the simplest projects are the most satisfying. I spent this afternoon building a classic birdhouse from some leftover pine boards. It's a straightforward design, but I focused on getting the details right to make it safe and comfortable for future residents. I made sure the entrance hole was the right size for smaller birds like wrens and chickadees, which helps keep larger, more aggressive birds out.

I used my miter saw to cut all the pieces to size, ensuring clean and accurate angles for the roof. The assembly was done with weatherproof wood glue and galvanized screws to stand up to the elements. I also drilled some small holes in the floor for drainage and near the top of the walls for ventilation to keep the interior from overheating.

I decided to leave the pine unfinished, as it's safer for the birds. The natural wood will weather over time to a nice silvery gray. One side of the birdhouse is hinged to make it easy to clean out at the end of the season. It's now hanging on a tree in my backyard, and I'm looking forward to seeing who moves in!',
   NOW() + INTERVAL '24 hours'); 