FROM    fritz:devel
EXPOSE  8080
WORKDIR /usr/src/app
CMD     ["npm", "start"]

#COPY    package.json /usr/src/app/
#RUN     npm install --production --no-optional
COPY    . /usr/src/app
