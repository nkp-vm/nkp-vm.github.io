#!/usr/bin/python
from HTMLParser import HTMLParser
from os.path import join
from os import walk
import json
import re

fPath = 'views/'
fList = []
metaTags = ['meta']
dataTags = ['p', 'strong', 'span', 'h1', 'h2', 'h3', 'h4']
anchorableTags = ['section', 'aside']
freetext_dictionary = {}
meta_dictionary = {}
minWordLength = 4
extractWordLength = 20
metaNameToSearch = "module"
moduleRegex = "views/m(\d)/sections"
sectionRegex = "s(\d+)_([a-z]{2}).html"

# e.g. <meta name="categories" content="one,two,three,four">

# create a subclass for the parser and override the handler methods
class MyHTMLParser(HTMLParser):
	takeTheData = False
	currentPath = ""
	parsingEnabled = False
	currentContent = []
	currentModule = ""
	currentSection = ""
	currentLanguage = ""

	#Decide whether to look within this tag
	def handle_starttag(self, tag, attrs):
		if tag in dataTags:
			self.takeTheData = True
		if tag in metaTags:
			for key, value in attrs:
				if key == 'name' and value == metaNameToSearch:
					self.parsingEnabled = True
				elif key == 'content' and self.parsingEnabled:
					keywordlist = value.split(",")
					self.currentContent = keywordlist
					print '   Found metadata: ' + value
					for word in keywordlist:
						self.add_to_meta_dictionary(word)
					self.parsingEnabled = False

	#Decide whether the section is finished
	# def handle_endtag(self, tag):

	#Handle data in tag
	def handle_data(self, data):
		if self.takeTheData:
			extract = ""
			wordlist = data.split(" ")
			for idx, word in enumerate(wordlist):
				stripped = word.strip().lower()
				if len(stripped) >= minWordLength:
					extract = self.create_extract(stripped, idx, wordlist)
					self.add_to_freetext_dictionary(stripped, extract)
		self.takeTheData = False

	def add_to_freetext_dictionary(self, word, extract):
		#code = self.currentContent[:]   # [:] copies the list
		#code.extend(self.currentSection)
		newEntry = {'extract':extract,'code':[self.currentSection,self.currentModule,self.currentLanguage]}   #Include path like this:  'path':self.currentPath,
		if word in freetext_dictionary:
			freetext_dictionary[word].append(newEntry)
		else:
			freetext_dictionary[word] = [newEntry]

	def add_to_meta_dictionary(self, word):
		newEntry = {'path' : self.currentPath}
		if word in meta_dictionary:
			meta_dictionary[word].append(newEntry)
		else:
			meta_dictionary[word] = [newEntry]

	# Create an extract of the words surrounding the search word
	def create_extract(self, word, index, wordlist):
		extract = ""
		end = len(wordlist)
		i = 0
		j = index - extractWordLength // 2
		if j < 0:
			j = 0
		if len(wordlist) <= extractWordLength:
			extract = " ".join(wordlist)
		else:
			while (i <= extractWordLength and j < end):
				extract+=wordlist[i]+" "
				i+=1
				j+=1
		return extract

	def set_path(self, path, section, module, language):
		self.currentPath = path
		self.currentModule = module
		self.currentSection = section
		self.currentLanguage = language
		self.currentContent = []
		print 'Opening file: ' + path + ' Section: ' + section + ' for Module: ' + self.currentModule

# instantiate the parser
parser = MyHTMLParser()

#build file list and feed into parser
smatch = re.compile(sectionRegex)
mmatch = re.compile(moduleRegex)
for (dirpath, dirnames, filenames) in walk(fPath):
	for fname in filenames:
		s = smatch.match(fname)
		if s:
			m = mmatch.match(dirpath)
			theFile = join(dirpath, fname)
			f = open(theFile, 'r')
			fr = f.read()
			parser.set_path(theFile, s.group(1), m.group(1), s.group(2))
			parser.feed(fr)

#write out to a JSON file
with open('json/freetext_dictionary.json', 'w') as fp:
    json.dump(freetext_dictionary, fp)
with open('json/meta_dictionary.json', 'w') as fp:
    json.dump(meta_dictionary, fp)