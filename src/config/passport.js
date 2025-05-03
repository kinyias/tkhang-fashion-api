const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.nguoiDung.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.nguoiDung.findUnique({
          where: { googleId: profile.id },
        });

        if (!user) {
          // Check if user exists with the same email
          const existingUser = await prisma.nguoiDung.findUnique({
            where: { email: profile.emails[0].value },
          });

          if (existingUser) {
            // Link Google account to existing user
            user = await prisma.nguoiDung.update({
              where: { id: existingUser.id },
              data: { googleId: profile.id },
            });
          } else {
            // Create new user
            const nameParts = profile.displayName
              ? profile.displayName.split(' ')
              : ['Unknown'];
            const firstName = nameParts[0];
            const lastName =
              nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            user = await prisma.nguoiDung.create({
              data: {
                googleId: profile.id,
                email: profile.emails[0].value,
                firstName: firstName,
                lastName: lastName,
                role: 'khachhang',
                emailVerified: true,
              },
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
